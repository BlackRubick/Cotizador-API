const Quote = require('../models/Quote');
const Client = require('../models/Client');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
const getQuotes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      client, 
      dateFrom, 
      dateTo,
      search 
    } = req.query;
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (client) {
      query.client = client;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    
    if (search) {
      query.$or = [
        { folio: { $regex: search, $options: 'i' } },
        { 'clientInfo.name': { $regex: search, $options: 'i' } },
        { 'clientInfo.contact': { $regex: search, $options: 'i' } }
      ];
    }

    const quotes = await Quote.find(query)
      .populate('client', 'name contact email')
      .populate('createdBy', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quote.countDocuments(query);

    res.json({
      success: true,
      data: quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
const getQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('client', 'name contact email phone address')
      .populate('createdBy', 'firstName lastName username')
      .populate('notes.createdBy', 'firstName lastName username');

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    res.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Get quote error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create quote
// @route   POST /api/quotes
// @access  Private
const createQuote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { client: clientId, products, terms } = req.body;

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Verify products exist and calculate totals
    const quoteProducts = [];
    let subtotal = 0;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      const productTotal = item.quantity * item.unitPrice;
      subtotal += productTotal;

      quoteProducts.push({
        productId: product._id,
        code: product.code,
        name: product.name,
        brand: product.brand,
        category: product.categoryName,
        description: product.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: productTotal
      });
    }

    const quoteData = {
      client: clientId,
      clientInfo: {
        name: client.name,
        contact: client.contact,
        email: client.email,
        phone: client.phone,
        address: client.address.full || client.address,
        position: req.body.clientInfo?.position || ''
      },
      products: quoteProducts,
      subtotal,
      terms: terms || {},
      createdBy: req.user.id
    };

    const quote = new Quote(quoteData);
    await quote.save();

    // Update client stats
    await Client.findByIdAndUpdate(clientId, {
      $inc: { totalQuotes: 1 },
      lastQuoteDate: new Date()
    });

    await quote.populate('client', 'name contact email');
    await quote.populate('createdBy', 'firstName lastName username');

    res.status(201).json({
      success: true,
      message: 'Quote created successfully',
      data: quote
    });

  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update quote
// @route   PUT /api/quotes/:id
// @access  Private
const updateQuote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Check if quote can be edited
    if (['confirmed', 'rejected', 'cancelled'].includes(quote.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit quote with current status'
      });
    }

    quote = await Quote.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('client', 'name contact email')
     .populate('createdBy', 'firstName lastName username');

    res.json({
      success: true,
      message: 'Quote updated successfully',
      data: quote
    });

  } catch (error) {
    console.error('Update quote error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update quote status
// @route   PATCH /api/quotes/:id/status
// @access  Private
const updateQuoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'pending', 'confirmed', 'rejected', 'cancelled', 'expired'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Update status and related dates
    quote.status = status;
    
    switch (status) {
      case 'sent':
        quote.sentDate = new Date();
        break;
      case 'confirmed':
        quote.confirmedDate = new Date();
        // Update client total amount
        await Client.findByIdAndUpdate(quote.client, {
          $inc: { totalAmount: quote.total }
        });
        break;
      case 'rejected':
        quote.rejectedDate = new Date();
        break;
    }

    await quote.save();

    res.json({
      success: true,
      message: 'Quote status updated successfully',
      data: quote
    });

  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private
const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }

    // Only allow deletion of draft quotes
    if (quote.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft quotes can be deleted'
      });
    }

    await Quote.findByIdAndDelete(req.params.id);

    // Update client stats
    await Client.findByIdAndUpdate(quote.client, {
      $inc: { totalQuotes: -1 }
    });

    res.json({
      success: true,
      message: 'Quote deleted successfully'
    });

  } catch (error) {
    console.error('Delete quote error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Quote not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get quote statistics
// @route   GET /api/quotes/stats
// @access  Private
const getQuoteStats = async (req, res) => {
  try {
    const totalQuotes = await Quote.countDocuments();
    const confirmedQuotes = await Quote.countDocuments({ status: 'confirmed' });
    const pendingQuotes = await Quote.countDocuments({ status: 'pending' });
    const rejectedQuotes = await Quote.countDocuments({ status: 'rejected' });
    
    const totalValue = await Quote.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalQuotes,
        confirmedQuotes,
        pendingQuotes,
        rejectedQuotes,
        totalValue: totalValue[0]?.total || 0
      }
    });

  } catch (error) {
    console.error('Get quote stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats
};
// controllers/quoteController.js - CORREGIDO para Sequelize/MySQL
const { Quote, Client, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
const getQuotes = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      clientId, 
      dateFrom, 
      dateTo,
      search 
    } = req.query;
    
    // Build where clause
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (clientId) {
      whereClause.clientId = clientId;
    }
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }
    
    if (search) {
      whereClause[Op.or] = [
        { folio: { [Op.iLike]: `%${search}%` } },
        { clientInfoName: { [Op.iLike]: `%${search}%` } },
        { clientInfoContact: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: quotes } = await Quote.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'contact', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: quotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
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
    const quote = await Quote.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'contact', 'email', 'phone', 'fullAddress']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

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

    console.log('📥 Create quote request body:', req.body);

    const { 
      clientId, 
      clientName,
      clientContact, 
      email,
      phone,
      clientAddress,
      clientPosition,
      products, 
      terms 
    } = req.body;

    // Validar que tenemos la información mínima necesaria
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email del cliente es requerido'
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Al menos un producto es requerido'
      });
    }

    // Verificar cliente existe si se proporciona clientId
    let client = null;
    if (clientId) {
      client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
    }

    // Preparar productos para la cotización
    const quoteProducts = products.map(item => ({
      productId: item.id || item.productId,
      code: item.code,
      name: item.name,
      brand: item.brand || 'N/A',
      category: item.category || item.categoryName || 'N/A',
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.basePrice || item.unitPrice,
      totalPrice: (item.quantity || 1) * (item.basePrice || item.unitPrice || 0)
    }));

    console.log('🛒 Processed products:', quoteProducts);

    // Calcular totales
    const subtotal = quoteProducts.reduce((sum, product) => sum + (product.totalPrice || 0), 0);
    const taxAmount = subtotal * 0.16; // 16% IVA
    const total = subtotal + taxAmount;

    // Crear datos de la cotización
    const quoteData = {
      clientId: clientId || null,
      clientInfoName: clientName || client?.name || 'Cliente',
      clientInfoContact: clientContact || client?.contact || 'Contacto',
      clientInfoEmail: email,
      clientInfoPhone: phone || client?.phone || '',
      clientInfoAddress: clientAddress || client?.fullAddress || '',
      clientInfoPosition: clientPosition || '',
      products: quoteProducts,
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total,
      currency: 'MXN',
      status: 'draft',
      termsPaymentConditions: terms?.paymentConditions || '100% Anticipado a la entrega. (Transferencia Bancaria)',
      termsDeliveryTime: terms?.deliveryTime || '15 días hábiles',
      termsWarranty: terms?.warranty || 'Garantía: 12 meses sobre defectos de fabricación.',
      termsObservations: terms?.observations || 'Sin más por el momento, nos ponemos a sus órdenes para cualquier duda y/o información adicional.',
      termsValidUntil: terms?.validUntil || null,
      createdBy: req.user.id
    };

    console.log('💾 Quote data to save:', {
      ...quoteData,
      products: `${quoteData.products.length} productos`
    });

    // Crear la cotización
    const quote = await Quote.create(quoteData);

    console.log('✅ Quote created with ID:', quote.id);

    // Actualizar estadísticas del cliente si existe
    if (clientId && client) {
      await Client.update(
        { 
          totalQuotes: client.totalQuotes + 1,
          lastQuoteDate: new Date()
        },
        { where: { id: clientId } }
      );
    }

    // Cargar la cotización creada con sus relaciones
    const createdQuote = await Quote.findByPk(quote.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'contact', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: createdQuote
    });

  } catch (error) {
    console.error('❌ Create quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al crear cotización',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    let quote = await Quote.findByPk(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Check if quote can be edited
    if (['confirmed', 'rejected', 'cancelled'].includes(quote.status)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar una cotización con estado actual'
      });
    }

    await quote.update(req.body);

    // Reload with associations
    const updatedQuote = await Quote.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name', 'contact', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente',
      data: updatedQuote
    });

  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
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
        message: 'Estado inválido'
      });
    }

    const quote = await Quote.findByPk(req.params.id);
    
    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Update status and related dates
    const updateData = { status };
    
    switch (status) {
      case 'sent':
        updateData.sentDate = new Date();
        break;
      case 'confirmed':
        updateData.confirmedDate = new Date();
        // Update client total amount if client exists
        if (quote.clientId) {
          const client = await Client.findByPk(quote.clientId);
          if (client) {
            await client.update({
              totalAmount: parseFloat(client.totalAmount || 0) + parseFloat(quote.total)
            });
          }
        }
        break;
      case 'rejected':
        updateData.rejectedDate = new Date();
        break;
    }

    await quote.update(updateData);

    res.json({
      success: true,
      message: 'Estado de cotización actualizado exitosamente',
      data: quote
    });

  } catch (error) {
    console.error('Update quote status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private
const deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByPk(req.params.id);

    if (!quote) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Only allow deletion of draft quotes
    if (quote.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar cotizaciones en borrador'
      });
    }

    await quote.destroy();

    // Update client stats if client exists
    if (quote.clientId) {
      const client = await Client.findByPk(quote.clientId);
      if (client && client.totalQuotes > 0) {
        await client.update({
          totalQuotes: client.totalQuotes - 1
        });
      }
    }

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    });

  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// @desc    Get quote statistics
// @route   GET /api/quotes/stats
// @access  Private
const getQuoteStats = async (req, res) => {
  try {
    const totalQuotes = await Quote.count();
    const confirmedQuotes = await Quote.count({ where: { status: 'confirmed' } });
    const pendingQuotes = await Quote.count({ where: { status: 'pending' } });
    const rejectedQuotes = await Quote.count({ where: { status: 'rejected' } });
    
    // Calculate total value of confirmed quotes
    const confirmedQuotesData = await Quote.findAll({
      where: { status: 'confirmed' },
      attributes: ['total']
    });
    
    const totalValue = confirmedQuotesData.reduce((sum, quote) => sum + parseFloat(quote.total || 0), 0);

    res.json({
      success: true,
      data: {
        totalQuotes,
        confirmedQuotes,
        pendingQuotes,
        rejectedQuotes,
        totalValue
      }
    });

  } catch (error) {
    console.error('Get quote stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
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
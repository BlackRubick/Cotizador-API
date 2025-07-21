const Client = require('../models/Client');
const { validationResult } = require('express-validator');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, type, status } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      query.clientType = type;
    }
    
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'createdBy',
        select: 'firstName lastName username'
      }
    };

    const clients = await Client.paginate(query, options);

    res.json({
      success: true,
      data: clients.docs,
      pagination: {
        page: clients.page,
        limit: clients.limit,
        totalPages: clients.totalPages,
        totalDocs: clients.totalDocs,
        hasNextPage: clients.hasNextPage,
        hasPrevPage: clients.hasPrevPage
      }
    });

  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single client
// @route   GET /api/clients/:id
// @access  Private
const getClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('createdBy', 'firstName lastName username');

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Get client error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create client
// @route   POST /api/clients
// @access  Private
const createClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const clientData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Check if client already exists
    const existingClient = await Client.findOne({
      $or: [
        { email: req.body.email },
        { name: req.body.name }
      ]
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client already exists with this name or email'
      });
    }

    const client = new Client(clientData);
    await client.save();

    await client.populate('createdBy', 'firstName lastName username');

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });

  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check for duplicate email/name (excluding current client)
    const existingClient = await Client.findOne({
      _id: { $ne: req.params.id },
      $or: [
        { email: req.body.email },
        { name: req.body.name }
      ]
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Client already exists with this name or email'
      });
    }

    client = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'firstName lastName username');

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });

  } catch (error) {
    console.error('Update client error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });

  } catch (error) {
    console.error('Delete client error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get client statistics
// @route   GET /api/clients/stats
// @access  Private
const getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = await Client.countDocuments({ status: 'active' });
    const clientTypes = await Client.distinct('clientType');
    const clientsWithEmail = await Client.countDocuments({ 
      email: { $exists: true, $ne: '' } 
    });

    res.json({
      success: true,
      data: {
        totalClients,
        activeClients,
        inactiveClients: totalClients - activeClients,
        clientTypes: clientTypes.length,
        clientsWithEmail
      }
    });

  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
};
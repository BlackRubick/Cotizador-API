// controllers/clientController.js
const { Client } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los clientes
const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, clientType, status } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { contact: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (clientType) {
      where.clientType = clientType;
    }
    
    if (status) {
      where.status = status;
    }

    // Calcular offset para paginación manual
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Obtener clientes con paginación manual
    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] }
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
      error: error.message
    });
  }
};

// Obtener un cliente por ID
const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findByPk(id, {
      attributes: { exclude: ['deletedAt'] }
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente',
      error: error.message
    });
  }
};

// Crear nuevo cliente
const createClient = async (req, res) => {
  try {
    const {
      name,
      contact,
      email,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      rfc,
      clientType,
      notes
    } = req.body;

    // Validaciones básicas
    if (!name || !contact || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Los campos nombre, contacto, email y teléfono son requeridos'
      });
    }

    // Verificar si ya existe un cliente con el mismo email
    const existingClient = await Client.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con este email'
      });
    }

    // Crear dirección completa
    const fullAddress = [street, city, state, zipCode, country]
      .filter(Boolean)
      .join(', ');

    // Crear cliente - IMPORTANTE: incluir createdBy del usuario autenticado
    const client = await Client.create({
      name,
      contact,
      email: email.toLowerCase(),
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      fullAddress,
      rfc,
      clientType: clientType || 'Hospital',
      notes,
      status: 'active',
      createdBy: req.user.id // ESTO ES LO QUE FALTABA - ID del usuario autenticado
    });

    res.status(201).json({
      success: true,
      data: client,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Create client error:', error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

// Actualizar cliente
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contact,
      email,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      rfc,
      clientType,
      notes,
      status
    } = req.body;

    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar email único (excluyendo el cliente actual)
    if (email && email.toLowerCase() !== client.email) {
      const existingClient = await Client.findOne({
        where: { 
          email: email.toLowerCase(),
          id: { [Op.not]: id }
        }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con este email'
        });
      }
    }

    // Crear dirección completa si se proporcionan los campos
    let fullAddress = client.fullAddress;
    if (street || city || state || zipCode || country) {
      fullAddress = [
        street || client.street,
        city || client.city,
        state || client.state,
        zipCode || client.zipCode,
        country || client.country
      ].filter(Boolean).join(', ');
    }

    // Actualizar cliente
    await client.update({
      name: name || client.name,
      contact: contact || client.contact,
      email: email ? email.toLowerCase() : client.email,
      phone: phone || client.phone,
      street: street || client.street,
      city: city || client.city,
      state: state || client.state,
      zipCode: zipCode || client.zipCode,
      country: country || client.country,
      fullAddress,
      rfc: rfc || client.rfc,
      clientType: clientType || client.clientType,
      notes: notes !== undefined ? notes : client.notes,
      status: status || client.status
    });

    res.status(200).json({
      success: true,
      data: client,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update client error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

// Eliminar cliente (soft delete)
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Soft delete
    await client.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

// Obtener estadísticas de clientes
const getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.count();
    const activeClients = await Client.count({ where: { status: 'active' } });
    const inactiveClients = await Client.count({ where: { status: 'inactive' } });
    
    // Contar por tipo de cliente
    const clientsByType = await Client.findAll({
      attributes: [
        'clientType',
        [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
      ],
      group: ['clientType']
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalClients,
        active: activeClients,
        inactive: inactiveClients,
        byType: clientsByType
      }
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
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
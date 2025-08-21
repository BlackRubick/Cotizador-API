// controllers/equipmentController.js
const { Equipment, Client, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all equipment for a client
// @route   GET /api/clients/:clientId/equipment
// @access  Private
const getClientEquipment = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, category, search, needsMaintenance } = req.query;
    
    // Verificar que el cliente existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Construir filtros
    let whereClause = { clientId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (category) {
      whereClause.category = category;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const equipment = await Equipment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filtrar por mantenimiento si se especifica
    let filteredEquipment = equipment;
    if (needsMaintenance === 'true') {
      filteredEquipment = equipment.filter(eq => {
        const maintenanceStatus = eq.needsMaintenance();
        return maintenanceStatus.needed;
      });
    }

    res.json({
      success: true,
      data: filteredEquipment,
      client: {
        id: client.id,
        name: client.name,
        contact: client.contact
      }
    });

  } catch (error) {
    console.error('Get client equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipos del cliente'
    });
  }
};

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
const getEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'contact', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    res.json({
      success: true,
      data: equipment
    });

  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener equipo'
    });
  }
};

// @desc    Create equipment for a client
// @route   POST /api/clients/:clientId/equipment
// @access  Private
const createEquipment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { clientId } = req.params;
    
    // Verificar que el cliente existe
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar que el número de serie no exista
    const existingEquipment = await Equipment.findOne({
      where: { serialNumber: req.body.serialNumber.toUpperCase() }
    });

    if (existingEquipment) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un equipo con este número de serie'
      });
    }

    const equipmentData = {
      ...req.body,
      clientId: parseInt(clientId),
      createdBy: req.user.id
    };

    const equipment = await Equipment.create(equipmentData);

    // Cargar el equipo creado con sus relaciones
    const createdEquipment = await Equipment.findByPk(equipment.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'contact']
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
      message: 'Equipo creado exitosamente',
      data: createdEquipment
    });

  } catch (error) {
    console.error('Create equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear equipo'
    });
  }
};

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private
const updateEquipment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    // Verificar número de serie único (excluyendo el equipo actual)
    if (req.body.serialNumber) {
      const existingEquipment = await Equipment.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          serialNumber: req.body.serialNumber.toUpperCase()
        }
      });

      if (existingEquipment) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un equipo con este número de serie'
        });
      }
    }

    await equipment.update(req.body);

    // Cargar el equipo actualizado con sus relaciones
    const updatedEquipment = await Equipment.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'contact']
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
      message: 'Equipo actualizado exitosamente',
      data: updatedEquipment
    });

  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar equipo'
    });
  }
};

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private
const deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    await equipment.destroy();

    res.json({
      success: true,
      message: 'Equipo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar equipo'
    });
  }
};

// @desc    Get equipment categories
// @route   GET /api/equipment/categories
// @access  Private
const getEquipmentCategories = async (req, res) => {
  try {
    const categories = [
      'Monitoreo',
      'Emergencia',
      'Ventilación',
      'Diagnóstico',
      'Laboratorio',
      'Cirugía',
      'Radiología',
      'Rehabilitación',
      'Anestesia',
      'Neonatología',
      'Cardiología',
      'Neurología',
      'Otro'
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get equipment categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

// @desc    Get equipment brands
// @route   GET /api/equipment/brands
// @access  Private
const getEquipmentBrands = async (req, res) => {
  try {
    const brands = [
      'General Electric',
      'Philips',
      'Siemens',
      'Medtronic',
      'Abbott',
      'Johnson & Johnson',
      'Roche',
      'Masimo',
      'Hamilton Medical',
      'Edwards Lifesciences',
      'Mindray',
      'Nihon Kohden',
      'Draeger',
      'Stryker',
      'Olympus',
      'Otro'
    ];

    res.json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Get equipment brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas'
    });
  }
};

// @desc    Get equipment statistics
// @route   GET /api/equipment/stats
// @access  Private
const getEquipmentStats = async (req, res) => {
  try {
    const { clientId } = req.query;
    
    let whereClause = {};
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const totalEquipment = await Equipment.count({ where: whereClause });
    const activeEquipment = await Equipment.count({ 
      where: { ...whereClause, status: 'active' } 
    });
    const maintenanceEquipment = await Equipment.count({ 
      where: { ...whereClause, status: 'maintenance' } 
    });
    const outOfServiceEquipment = await Equipment.count({ 
      where: { ...whereClause, status: 'out_of_service' } 
    });

    // Estadísticas por categoría
    const categoryStats = await Equipment.findAll({
      attributes: [
        'category',
        [Equipment.sequelize.fn('COUNT', Equipment.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['category'],
      order: [[Equipment.sequelize.fn('COUNT', Equipment.sequelize.col('id')), 'DESC']]
    });

    // Estadísticas por marca
    const brandStats = await Equipment.findAll({
      attributes: [
        'brand',
        [Equipment.sequelize.fn('COUNT', Equipment.sequelize.col('id')), 'count']
      ],
      where: whereClause,
      group: ['brand'],
      order: [[Equipment.sequelize.fn('COUNT', Equipment.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    // Equipos que necesitan mantenimiento
    const allEquipment = await Equipment.findAll({ where: whereClause });
    const needsMaintenanceCount = allEquipment.filter(eq => {
      const maintenanceStatus = eq.needsMaintenance();
      return maintenanceStatus.needed;
    }).length;

    res.json({
      success: true,
      data: {
        totalEquipment,
        activeEquipment,
        maintenanceEquipment,
        outOfServiceEquipment,
        needsMaintenanceCount,
        categoryStats,
        brandStats,
        utilizationRate: totalEquipment > 0 ? ((activeEquipment / totalEquipment) * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Get equipment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// @desc    Get equipment maintenance alerts
// @route   GET /api/equipment/maintenance-alerts
// @access  Private
const getMaintenanceAlerts = async (req, res) => {
  try {
    const { clientId } = req.query;
    
    let whereClause = {};
    if (clientId) {
      whereClause.clientId = clientId;
    }

    const equipment = await Equipment.findAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'contact']
        }
      ]
    });

    const alerts = [];
    
    equipment.forEach(eq => {
      const maintenanceStatus = eq.needsMaintenance();
      if (maintenanceStatus.needed) {
        alerts.push({
          equipmentId: eq.id,
          equipmentName: eq.name,
          serialNumber: eq.serialNumber,
          client: eq.client,
          category: eq.category,
          brand: eq.brand,
          location: eq.location,
          lastMaintenance: eq.lastMaintenance,
          daysUntil: maintenanceStatus.daysUntil,
          overdue: maintenanceStatus.overdue,
          nextMaintenanceDate: maintenanceStatus.nextMaintenanceDate,
          priority: maintenanceStatus.overdue ? 'high' : 'medium'
        });
      }
    });

    // Ordenar por prioridad (vencidos primero) y luego por días hasta vencimiento
    alerts.sort((a, b) => {
      if (a.overdue && !b.overdue) return -1;
      if (!a.overdue && b.overdue) return 1;
      return a.daysUntil - b.daysUntil;
    });

    res.json({
      success: true,
      data: alerts,
      summary: {
        total: alerts.length,
        overdue: alerts.filter(a => a.overdue).length,
        upcoming: alerts.filter(a => !a.overdue).length
      }
    });

  } catch (error) {
    console.error('Get maintenance alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas de mantenimiento'
    });
  }
};

module.exports = {
  getClientEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentCategories,
  getEquipmentBrands,
  getEquipmentStats,
  getMaintenanceAlerts
};
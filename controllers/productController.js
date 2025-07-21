// controllers/productController.js - Simplificado para tus campos específicos
const { Product, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      servicio,
      especialidad,
      clasificacion,
      proveedor,
      almacen,
      minPrice,
      maxPrice,
      sort = 'createdAt'
    } = req.query;
    
    // Build where clause
    let whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { code: { [Op.iLike]: `%${search}%` } },
        { item: { [Op.iLike]: `%${search}%` } },
        { servicio: { [Op.iLike]: `%${search}%` } },
        { especialidad: { [Op.iLike]: `%${search}%` } },
        { clasificacion: { [Op.iLike]: `%${search}%` } },
        { paraDescripcion: { [Op.iLike]: `%${search}%` } },
        { proveedor: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (servicio) {
      whereClause.servicio = { [Op.iLike]: `%${servicio}%` };
    }
    
    if (especialidad) {
      whereClause.especialidad = { [Op.iLike]: `%${especialidad}%` };
    }
    
    if (clasificacion) {
      whereClause.clasificacion = { [Op.iLike]: `%${clasificacion}%` };
    }
    
    if (proveedor) {
      whereClause.proveedor = { [Op.iLike]: `%${proveedor}%` };
    }
    
    if (almacen) {
      whereClause.almacen = { [Op.iLike]: `%${almacen}%` };
    }
    
    if (minPrice || maxPrice) {
      whereClause.precioVentaPaquete = {};
      if (minPrice) whereClause.precioVentaPaquete[Op.gte] = parseFloat(minPrice);
      if (maxPrice) whereClause.precioVentaPaquete[Op.lte] = parseFloat(maxPrice);
    }

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build order clause
    let orderClause = [];
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';
      orderClause.push([sortField, sortDirection]);
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if product code already exists
    const existingProduct = await Product.findOne({ 
      where: { code: req.body.code.toUpperCase() } 
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this code already exists'
      });
    }

    const productData = {
      ...req.body,
      createdBy: req.user.id,
      code: req.body.code.toUpperCase()
    };

    const product = await Product.create(productData);

    // Load created product with associations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check for duplicate code (excluding current product)
    if (req.body.code) {
      const existingProduct = await Product.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          code: req.body.code.toUpperCase()
        }
      });

      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Product with this code already exists'
        });
      }
    }

    // Update product
    const updateData = { ...req.body };
    if (req.body.code) {
      updateData.code = req.body.code.toUpperCase();
    }

    await product.update(updateData);

    // Reload with associations
    const updatedProduct = await Product.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get product statistics
// @route   GET /api/products/stats
// @access  Private
const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.count();
    
    // Servicios stats
    const servicioStats = await Product.findAll({
      attributes: [
        'servicio',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      where: {
        servicio: { [Op.not]: null }
      },
      group: ['servicio'],
      order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']]
    });

    // Especialidad stats
    const especialidadStats = await Product.findAll({
      attributes: [
        'especialidad',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      where: {
        especialidad: { [Op.not]: null }
      },
      group: ['especialidad'],
      order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    // Proveedores stats
    const proveedorStats = await Product.findAll({
      attributes: [
        'proveedor',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      where: {
        proveedor: { [Op.not]: null }
      },
      group: ['proveedor'],
      order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        servicioStats,
        especialidadStats,
        proveedorStats
      }
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
};
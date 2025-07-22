// controllers/categoryController.js - VERSIÓN FINAL CORREGIDA
const { Category, Product, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const { active, includeProducts = false } = req.query;
    
    let whereClause = {};
    
    // Solo filtrar por isActive si se especifica explícitamente
    if (active !== undefined && active !== 'all') {
      if (active === 'true' || active === true) {
        whereClause.isActive = true;
      } else if (active === 'false' || active === false) {
        whereClause.isActive = false;
      }
    }

    console.log('🔍 Category query - whereClause:', whereClause);

    let includeOptions = [
      {
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName', 'username'],
        required: false
      }
    ];

    if (includeProducts === 'true') {
      includeOptions.push({
        model: Product,
        as: 'products',
        attributes: ['id', 'code', 'item'],
        required: false
      });
    }

    const categories = await Category.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    console.log(`📦 Categories found: ${categories.length}`);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        },
        {
          model: Category,
          as: 'parentCategory',
          attributes: ['name']
        },
        {
          model: Category,
          as: 'subcategories'
        },
        {
          model: Product,
          as: 'products',
          attributes: ['id', 'code', 'item', 'precioVentaPaquete']
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      where: {
        name: {
          [Op.iLike]: req.body.name
        }
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const categoryData = {
      ...req.body,
      createdBy: req.user.id
    };

    const category = await Category.create(categoryData);

    const createdCategory = await Category.findByPk(category.id, {
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
      message: 'Category created successfully',
      data: createdCategory
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate name (excluding current category)
    if (req.body.name) {
      const existingCategory = await Category.findOne({
        where: {
          id: { [Op.ne]: req.params.id },
          name: { [Op.iLike]: req.body.name }
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    await category.update(req.body);

    const updatedCategory = await Category.findByPk(req.params.id, {
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
      message: 'Category updated successfully',
      data: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has products
    const productCount = await Product.count({ 
      where: { categoryId: req.params.id } 
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. It contains products.'
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};
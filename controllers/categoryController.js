// controllers/categoryController.js
const { Category, Product, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const { active = true, includeProducts = false } = req.query;
    
    let whereClause = {};
    if (active !== 'all') {
      whereClause.isActive = active === 'true';
    }

    let includeOptions = [
      {
        model: User,
        as: 'creator',
        attributes: ['firstName', 'lastName', 'username']
      }
    ];

    if (includeProducts === 'true') {
      includeOptions.push({
        model: Category,
        as: 'subcategories'
      });
    }

    const categories = await Category.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
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
        }
      ]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get products in this category
    const products = await Product.findAll({ 
      where: { 
        categoryId: req.params.id,
        status: 'active' 
      },
      attributes: ['name', 'code', 'basePrice']
    });

    res.json({
      success: true,
      data: {
        ...category.toJSON(),
        products
      }
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

    // Validate parent category if provided
    if (req.body.parentCategoryId) {
      const parentCategory = await Category.findByPk(req.body.parentCategoryId);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }

    const categoryData = {
      ...req.body,
      createdBy: req.user.id
    };

    const category = await Category.create(categoryData);

    // Load the created category with associations
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

    // Validate parent category if provided
    if (req.body.parentCategoryId) {
      const parentCategory = await Category.findByPk(req.body.parentCategoryId);
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found'
        });
      }

      // Prevent circular reference
      if (req.body.parentCategoryId == req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
    }

    await category.update(req.body);

    // Reload with associations
    const updatedCategory = await Category.findByPk(req.params.id, {
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

    // Check if category has subcategories
    const subcategoryCount = await Category.count({ 
      where: { parentCategoryId: req.params.id } 
    });
    
    if (subcategoryCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category. It has subcategories.'
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
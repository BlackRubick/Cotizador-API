const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');

const { auth } = require('../middleware/auth');

// Validation rules
const productValidation = [
  body('code')
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ max: 50 })
    .withMessage('Code cannot exceed 50 characters'),
  body('name')
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Name cannot exceed 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  body('categoryName')
    .notEmpty()
    .withMessage('Category name is required'),
  body('brand')
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ max: 100 })
    .withMessage('Brand cannot exceed 100 characters'),
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  body('compatibility')
    .optional()
    .isArray()
    .withMessage('Compatibility must be an array'),
  body('compatibility.*')
    .isIn(['ADULTO', 'PEDIÁTRICO', 'NEONATAL', 'HOSPITAL', 'CLÍNICA', 'AMBULANCIA', 'LABORATORIO'])
    .withMessage('Invalid compatibility option')
];

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/stats', getProductStats);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', productValidation, createProduct);
router.put('/:id', productValidation, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
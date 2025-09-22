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

// ========== TEMPORAL: Comentar middleware de autenticación ==========
// const { protect } = require('../middleware/auth');

// Validation rules simplificadas
const productValidation = [
  body('code')
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ max: 50 })
    .withMessage('Code cannot exceed 50 characters'),
  body('item')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Item cannot exceed 2000 characters'),
  body('servicio')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Servicio cannot exceed 100 characters'),
  body('especialidad')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Especialidad cannot exceed 100 characters'),
  body('clasificacion')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Clasificacion cannot exceed 100 characters'),
  body('proveedor')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Proveedor cannot exceed 200 characters'),
  body('moneda')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Invalid currency')
];

// ========== TEMPORAL: Sin middleware de autenticación ==========
// router.use(protect);

// Routes - Sin protección temporal
router.get('/stats', getProductStats);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', productValidation, createProduct);
router.put('/:id', productValidation, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
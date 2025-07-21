// routes/products.js - Simplificado para tus campos específicos
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

// Validation rules simplificadas
const productValidation = [
  body('code')
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ max: 50 })
    .withMessage('Code cannot exceed 50 characters'),
  body('item')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Item cannot exceed 200 characters'),
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
  body('cantidadPaquete')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Cantidad paquete must be at least 1'),
  body('costo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Costo must be a positive number'),
  body('costoUnitario')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Costo unitario must be a positive number'),
  body('precioVentaPaquete')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio venta paquete must be a positive number'),
  body('precioUnitario')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio unitario must be a positive number'),
  body('factoryPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Factory price must be a positive number'),
  body('landedFactor')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Landed factor must be a positive number'),
  body('marginFactor')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Margin factor must be a positive number'),
  body('valorMoneda')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valor moneda must be a positive number'),
  body('comisionVenta')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Comision venta must be between 0 and 100'),
  body('impuestos')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Impuestos must be between 0 and 100'),
  body('moneda')
    .optional()
    .isIn(['MXN', 'USD', 'EUR'])
    .withMessage('Invalid currency')
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
const express = require('express');
const { body } = require('express-validator');

// ========== DEBUG: Verificar que se importan las funciones ==========
console.log('🔍 Importing bulk controller...');
const bulkController = require('../controllers/bulkController');
console.log('🔍 Bulk controller imported:', Object.keys(bulkController));

const { bulkUploadProducts, bulkUploadCategories, testController } = bulkController;

// ========== DEBUG: Verificar cada función ==========
console.log('🔍 bulkUploadProducts:', typeof bulkUploadProducts);
console.log('🔍 bulkUploadCategories:', typeof bulkUploadCategories);
console.log('🔍 testController:', typeof testController);

const { protect } = require('../middleware/auth');

const router = express.Router();

// Test route to verify controller is loaded
router.get('/test', testController);

// Validaciones para carga masiva de productos
const validateBulkProducts = [
  body('products')
    .isArray({ min: 1 })
    .withMessage('Se requiere un array de productos con al menos un elemento'),
  body('products.*.name')
    .notEmpty()
    .withMessage('Nombre del producto es requerido'),
  body('products.*.basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precio debe ser un número mayor o igual a 0')
];

// ========== TEMPORAL: Sin middleware protect para debuggear ==========
router.post('/products', validateBulkProducts, bulkUploadProducts);
router.post('/categories', bulkUploadCategories);

module.exports = router;
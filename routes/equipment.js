// routes/equipment.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getClientEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentCategories,
  getEquipmentBrands,
  getEquipmentStats,
  getMaintenanceAlerts
} = require('../controllers/equipmentController');

const { auth } = require('../middleware/auth');

// Validation rules para crear/actualizar equipo
const equipmentValidation = [
  body('name')
    .notEmpty()
    .withMessage('Nombre del equipo es requerido')
    .isLength({ max: 200 })
    .withMessage('Nombre no puede exceder 200 caracteres'),
  body('model')
    .notEmpty()
    .withMessage('Modelo es requerido')
    .isLength({ max: 100 })
    .withMessage('Modelo no puede exceder 100 caracteres'),
  body('serialNumber')
    .notEmpty()
    .withMessage('Número de serie es requerido')
    .isLength({ max: 100 })
    .withMessage('Número de serie no puede exceder 100 caracteres'),
  body('category')
    .isIn([
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
    ])
    .withMessage('Categoría inválida'),
  body('brand')
    .notEmpty()
    .withMessage('Marca es requerida')
    .isLength({ max: 100 })
    .withMessage('Marca no puede exceder 100 caracteres'),
  body('location')
    .notEmpty()
    .withMessage('Ubicación es requerida')
    .isLength({ max: 200 })
    .withMessage('Ubicación no puede exceder 200 caracteres'),
  body('status')
    .optional()
    .isIn(['active', 'maintenance', 'out_of_service', 'retired'])
    .withMessage('Estado inválido'),
  body('installDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de instalación debe ser una fecha válida'),
  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de compra debe ser una fecha válida'),
  body('warrantyExpiry')
    .optional()
    .isISO8601()
    .withMessage('Fecha de vencimiento de garantía debe ser una fecha válida'),
  body('lastMaintenance')
    .optional()
    .isISO8601()
    .withMessage('Fecha de último mantenimiento debe ser una fecha válida'),
  body('maintenanceInterval')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Intervalo de mantenimiento debe ser entre 1 y 60 meses'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Costo debe ser un número positivo'),
  body('currency')
    .optional()
    .isIn(['MXN', 'USD', 'EUR'])
    .withMessage('Moneda inválida'),
  body('specifications')
    .optional()
    .isArray()
    .withMessage('Especificaciones debe ser un array'),
  body('supplier')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Proveedor no puede exceder 200 caracteres')
];

// Apply auth middleware to all routes
router.use(auth);

// Rutas de utilidad (sin parámetros)
router.get('/categories', getEquipmentCategories);
router.get('/brands', getEquipmentBrands);
router.get('/stats', getEquipmentStats);
router.get('/maintenance-alerts', getMaintenanceAlerts);

// Rutas específicas de equipo individual
router.get('/:id', getEquipment);
router.put('/:id', equipmentValidation, updateEquipment);
router.delete('/:id', deleteEquipment);

// Estas rutas van en clients.js pero las defino aquí para referencia
// router.get('/clients/:clientId/equipment', getClientEquipment);
// router.post('/clients/:clientId/equipment', equipmentValidation, createEquipment);

module.exports = router;
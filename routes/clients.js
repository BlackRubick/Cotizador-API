const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats
} = require('../controllers/clientController');

// ✅ CORRECCIÓN: Importar correctamente el middleware auth
const { auth } = require('../middleware/auth');

// Validation rules
const clientValidation = [
  body('name')
    .notEmpty()
    .withMessage('Client name is required')
    .isLength({ max: 200 })
    .withMessage('Name cannot exceed 200 characters'),
  body('contact')
    .notEmpty()
    .withMessage('Contact person is required')
    .isLength({ max: 100 })
    .withMessage('Contact name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('phone')
    .notEmpty()
    .withMessage('Phone is required'),
  body('clientType')
    .isIn(['Hospital', 'Clínica', 'Laboratorio', 'Centro Diagnóstico', 'Consultorio', 'Otro'])
    .withMessage('Invalid client type'),
  body('rfc')
    .optional()
    .matches(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/)
    .withMessage('Please enter a valid RFC')
];

// Apply auth middleware to all routes
router.use(auth); // ✅ Ahora auth es una función

// Routes
router.get('/stats', getClientStats);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', clientValidation, createClient);
router.put('/:id', clientValidation, updateClient);
router.delete('/:id', deleteClient);

module.exports = router;
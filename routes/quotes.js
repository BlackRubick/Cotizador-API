// routes/quotes.js - CORREGIDO para Sequelize/MySQL
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const upload = multer();

const {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats,
  sendQuoteEmail
} = require('../controllers/quoteController');

const { auth } = require('../middleware/auth');

// Validation rules para crear cotización
const quoteValidation = [
  body('email')
    .isEmail()
    .withMessage('Email del cliente es requerido'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('Al menos un producto es requerido'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser al menos 1'),
  body('products.*.basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('products.*.unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser un número positivo'),
  body('clientId')
    .optional()
    .isInt()
    .withMessage('ID de cliente inválido'),
  body('clientName')
    .optional()
    .notEmpty()
    .withMessage('Nombre del cliente es requerido si no se proporciona clientId'),
  body('clientContact')
    .optional()
    .notEmpty()
    .withMessage('Contacto del cliente es requerido')
];

// Validation rules para actualizar estado
const statusUpdateValidation = [
  body('status')
    .isIn(['draft', 'sent', 'pending', 'confirmed', 'rejected', 'cancelled', 'expired'])
    .withMessage('Estado inválido')
];

// Apply auth middleware to all routes
// router.use(auth); // <--- Desactivado para pruebas

// Routes
router.get('/stats', getQuoteStats);
router.get('/', getQuotes);
router.get('/:id', getQuote);
router.post('/', quoteValidation, createQuote);
router.put('/:id', quoteValidation, updateQuote);
router.patch('/:id/status', statusUpdateValidation, updateQuoteStatus);
router.delete('/:id', deleteQuote);
router.post('/:id/send', upload.single('pdfBuffer'), sendQuoteEmail); // <--- Ruta para enviar cotización por email

module.exports = router;
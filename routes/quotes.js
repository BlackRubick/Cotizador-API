const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  updateQuoteStatus,
  deleteQuote,
  getQuoteStats
} = require('../controllers/quoteController');

const { auth } = require('../middleware/auth');

// Validation rules
const quoteValidation = [
  body('client')
    .notEmpty()
    .withMessage('Client is required')
    .isMongoId()
    .withMessage('Invalid client ID'),
  body('products')
    .isArray({ min: 1 })
    .withMessage('At least one product is required'),
  body('products.*.productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('products.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('products.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number')
];

const statusUpdateValidation = [
  body('status')
    .isIn(['draft', 'sent', 'pending', 'confirmed', 'rejected', 'cancelled', 'expired'])
    .withMessage('Invalid status')
];

// Apply auth middleware to all routes
router.use(auth);

// Routes
router.get('/stats', getQuoteStats);
router.get('/', getQuotes);
router.get('/:id', getQuote);
router.post('/', quoteValidation, createQuote);
router.put('/:id', quoteValidation, updateQuote);
router.patch('/:id/status', statusUpdateValidation, updateQuoteStatus);
router.delete('/:id', deleteQuote);

module.exports = router;
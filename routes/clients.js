const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// ========== IMPORTAR TODOS LOS CONTROLADORES ==========
const {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  // ========== NUEVOS MÉTODOS DE ENCARGADOS ==========
  getClientEncargados,
  addEncargadoToClient,
  updateClientEncargado,
  removeEncargadoFromClient
} = require('../controllers/clientController');

// ========== TEMPORAL: Comentar middleware de autenticación ==========
// const { protect } = require('../middleware/auth');

// ========== VALIDACIONES ACTUALIZADAS PARA LOS NUEVOS CAMPOS ==========
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
    .optional()
    .isIn(['Hospital', 'Clínica', 'Laboratorio', 'Centro Diagnóstico', 'Consultorio', 'Otro'])
    .withMessage('Invalid client type'),
  body('rfc')
    .optional()
    .custom((value) => {
      // ========== CORREGIDO: RFC opcional sin validación estricta ==========
      if (!value || value.trim() === '') {
        return true; // Permitir RFC vacío
      }
      // Solo validar formato si tiene contenido
      const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
      if (!rfcPattern.test(value)) {
        throw new Error('Please enter a valid RFC format');
      }
      return true;
    }),
    
  // ========== CAMPOS ESPECÍFICOS DE HOSPITAL ==========
  body('hospitalName')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Hospital name cannot exceed 200 characters'),
  body('dependencia')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Dependencia cannot exceed 200 characters'),
  body('contrato')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Contrato cannot exceed 100 characters'),
    
  // ========== INFORMACIÓN DE EQUIPO ==========
  body('equipmentName')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Equipment name cannot exceed 200 characters'),
  body('equipmentBrand')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Equipment brand cannot exceed 100 characters'),
  body('equipmentModel')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Equipment model cannot exceed 100 characters'),
  body('serialNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Serial number cannot exceed 100 characters'),
    
  // ========== FECHAS ==========
  body('installationDate')
    .optional()
    .isISO8601()
    .withMessage('Installation date must be a valid date'),
  body('lastMaintenance')
    .optional()
    .isISO8601()
    .withMessage('Last maintenance date must be a valid date'),
    
  // ========== ESTATUS ==========
  body('statusApril2025')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Status April 2025 cannot exceed 100 characters'),
  body('statusStart2026')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Status start 2026 cannot exceed 100 characters')
];

// ========== VALIDACIONES PARA ENCARGADOS ==========
const encargadoValidation = [
  body('nombre')
    .notEmpty()
    .withMessage('Nombre del encargado es requerido')
    .isLength({ max: 100 })
    .withMessage('Nombre cannot exceed 100 characters'),
  body('cargo')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Cargo cannot exceed 100 characters'),
  body('telefono')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Teléfono cannot exceed 20 characters'),
  body('email')
    .optional()
    .custom((value) => {
      // Permitir email vacío o validar formato
      if (!value || value.trim() === '') {
        return true;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        throw new Error('Please enter a valid email format');
      }
      return true;
    })
    .normalizeEmail()
];

// ========== MIDDLEWARE TEMPORAL PARA DESARROLLO ==========
const mockAuth = (req, res, next) => {
  // Simular usuario autenticado para desarrollo
  req.user = {
    id: 1,
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User'
  };
  next();
};

// ========== APLICAR MIDDLEWARE TEMPORAL ==========
router.use(mockAuth);

// ========== RUTAS DE CLIENTES ==========
router.get('/stats', getClientStats);
router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', clientValidation, createClient);
router.put('/:id', clientValidation, updateClient);
router.delete('/:id', deleteClient);

// ========== NUEVAS RUTAS PARA ENCARGADOS ==========
router.get('/:id/encargados', getClientEncargados);
router.post('/:id/encargados', encargadoValidation, addEncargadoToClient);
router.put('/:id/encargados/:encargadoId', encargadoValidation, updateClientEncargado);
router.delete('/:id/encargados/:encargadoId', removeEncargadoFromClient);

module.exports = router;
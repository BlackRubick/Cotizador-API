const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ========== CAMPOS BÁSICOS ==========
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Client name is required' }
    }
  },
  contact: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Contact person is required' }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email' }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Phone is required' }
    }
  },
  
  // ========== DIRECCIÓN ==========
  street: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'México'
  },
  fullAddress: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // ========== INFORMACIÓN FISCAL ==========
  rfc: {
    type: DataTypes.STRING(13),
    allowNull: true,
    validate: {
      // ========== CORREGIDO: RFC opcional ==========
      customValidator(value) {
        // Permitir valores vacíos, null o undefined
        if (!value || value === '' || value === null) {
          return;
        }
        
        // Solo validar si tiene un valor real
        const rfcPattern = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;
        if (!rfcPattern.test(value)) {
          throw new Error('Please enter a valid RFC format (e.g., XAXX010101000)');
        }
      }
    }
  },
  
  // ========== CLASIFICACIÓN ==========
  clientType: {
    type: DataTypes.ENUM(
      'Hospital',
      'Clínica', 
      'Laboratorio',
      'Centro Diagnóstico',
      'Consultorio',
      'Otro'
    ),
    allowNull: false
  },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // ========== CAMPOS ESPECÍFICOS PARA HOSPITALES (MAPEAR A COLUMNAS REALES) ==========
  hospitalName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'hospital_name' // ← MAPEO A COLUMNA REAL
  },
  dependencia: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'dependencia' // ← YA COINCIDE
  },
  contrato: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'contrato' // ← YA COINCIDE
  },
  
  // ========== INFORMACIÓN DE EQUIPO (MAPEAR A COLUMNAS REALES) ==========
  equipmentName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'equipment_name' // ← MAPEO A COLUMNA REAL
  },
  equipmentBrand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'equipment_brand' // ← MAPEO A COLUMNA REAL
  },
  equipmentModel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'equipment_model' // ← MAPEO A COLUMNA REAL
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'serial_number' // ← MAPEO A COLUMNA REAL
  },
  
  // ========== FECHAS (MAPEAR A COLUMNAS REALES) ==========
  installationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'installation_date' // ← MAPEO A COLUMNA REAL
  },
  lastMaintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_maintenance' // ← MAPEO A COLUMNA REAL
  },
  
  // ========== ESTATUS (MAPEAR A COLUMNAS REALES) ==========
  statusApril2025: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'status_april_2025' // ← MAPEO A COLUMNA REAL
  },
  statusStart2026: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'status_start_2026' // ← MAPEO A COLUMNA REAL
  },
  
  // ========== AUDITORÍA ==========
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // ========== CAMPOS DE COTIZACIONES ==========
  lastQuoteDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalQuotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
  
}, {
  tableName: 'clients',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['name'] },
    { fields: ['clientType'] },
    { fields: ['status'] },
    { fields: ['serial_number'] },
    { fields: ['city'] },
    { fields: ['state'] },
    { fields: ['createdBy'] },
    { fields: ['createdAt'] }
  ]
});

// ========== ASOCIACIONES ==========
Client.associate = (models) => {
  // Relación con User (creador)
  Client.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  // Un cliente puede tener muchas cotizaciones
  Client.hasMany(models.Quote, {
    foreignKey: 'clientId',
    as: 'quotes'
  });
};

module.exports = Client;
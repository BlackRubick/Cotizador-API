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
    },
    comment: 'Nombre del cliente / Empresa responsable'
  },
  contact: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Contact person is required' }
    },
    comment: 'Persona de contacto / Dependencia'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email' }
    },
    comment: 'Email de contacto'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Phone is required' }
    },
    comment: 'Teléfono de contacto'
  },
  
  // ========== DIRECCIÓN ==========
  street: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Calle y número'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ciudad'
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Estado'
  },
  zipCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Código postal'
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'México',
    comment: 'País'
  },
  fullAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Dirección completa concatenada'
  },
  
  // ========== INFORMACIÓN FISCAL ==========
  rfc: {
    type: DataTypes.STRING(13),
    allowNull: true,
    validate: {
      is: {
        args: /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/,
        msg: 'Please enter a valid RFC'
      }
    },
    comment: 'RFC del cliente'
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
    defaultValue: 'Hospital',
    comment: 'Tipo de cliente'
  },
  
  // ========== CAMPOS ESPECÍFICOS PARA HOSPITALES ==========
  hospitalName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'hospital_name',
    comment: 'Nombre específico del hospital'
  },
  dependencia: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Dependencia del hospital'
  },
  contrato: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Número de contrato'
  },
  
  // ========== INFORMACIÓN DE EQUIPO ==========
  equipmentName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'equipment_name',
    comment: 'Nombre del equipo médico'
  },
  equipmentBrand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'equipment_brand',
    comment: 'Marca del equipo'
  },
  equipmentModel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'equipment_model',
    comment: 'Modelo del equipo'
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'serial_number',
    comment: 'Número de serie del equipo'
  },
  
  // ========== FECHAS IMPORTANTES ==========
  installationDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'installation_date',
    comment: 'Fecha de instalación del equipo'
  },
  lastMaintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'last_maintenance',
    comment: 'Fecha del último mantenimiento'
  },
  
  // ========== ESTATUS ==========
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'pending'),
    defaultValue: 'active',
    comment: 'Estado del cliente'
  },
  statusApril2025: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'status_april_2025',
    comment: 'Estatus para abril 2025'
  },
  statusStart2026: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'status_start_2026',
    comment: 'Estatus para inicio 2026'
  },
  
  // ========== NOTAS Y METADATA ==========
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales y datos JSON'
  },
  
  // ========== AUDITORÍA ==========
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Usuario que creó el registro'
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
    { fields: ['serialNumber'] },
    { fields: ['city'] },
    { fields: ['state'] },
    { fields: ['createdBy'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeSave: (client) => {
      // Normalizar email
      if (client.email) {
        client.email = client.email.toLowerCase().trim();
      }
      
      // Crear dirección completa
      if (client.street || client.city || client.state || client.zipCode || client.country) {
        client.fullAddress = [
          client.street,
          client.city,
          client.state,
          client.zipCode,
          client.country
        ].filter(Boolean).join(', ');
      }
      
      // Normalizar RFC
      if (client.rfc) {
        client.rfc = client.rfc.toUpperCase().trim();
      }
    }
  }
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
  
  // Un cliente puede tener muchos equipos
  Client.hasMany(models.Equipment, {
    foreignKey: 'clientId',
    as: 'equipment'
  });
};

module.exports = Client;
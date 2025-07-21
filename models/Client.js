const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  contact: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
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
  rfc: {
    type: DataTypes.STRING(13),
    allowNull: true,
    validate: {
      is: /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/
    }
  },
  clientType: {
    type: DataTypes.ENUM('Hospital', 'Clínica', 'Laboratorio', 'Centro Diagnóstico', 'Consultorio', 'Otro'),
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
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true, // ← CAMBIO PRINCIPAL: de false a true
    references: {
      model: 'users',
      key: 'id'
    }
  },
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
    defaultValue: 0
  }
}, {
  tableName: 'clients',
  hooks: {
    beforeSave: (client) => {
      // Create full address
      if (client.street || client.city || client.state) {
        const addressParts = [
          client.street,
          client.city,
          client.state,
          client.zipCode,
          client.country
        ].filter(Boolean);
        
        client.fullAddress = addressParts.join(', ');
      }
    }
  }
});

module.exports = Client;
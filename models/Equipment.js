// models/Equipment.js - Modelo para equipos biomédicos
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipment = sequelize.define('Equipment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  serialNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  category: {
    type: DataTypes.ENUM(
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
    ),
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  installDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  warrantyExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lastMaintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  maintenanceInterval: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12,
    validate: {
      min: 1,
      max: 60
    },
    comment: 'Intervalo de mantenimiento en meses'
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'out_of_service', 'retired'),
    defaultValue: 'active'
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de especificaciones técnicas'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  supplier: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.ENUM('MXN', 'USD', 'EUR'),
    defaultValue: 'MXN'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'equipment',
  indexes: [
    { fields: ['clientId'] },
    { fields: ['serialNumber'] },
    { fields: ['category'] },
    { fields: ['brand'] },
    { fields: ['status'] },
    { fields: ['lastMaintenance'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeCreate: (equipment) => {
      // Asegurar que el número de serie esté en mayúsculas
      if (equipment.serialNumber) {
        equipment.serialNumber = equipment.serialNumber.toString().toUpperCase().trim();
      }
    },
    beforeUpdate: (equipment) => {
      if (equipment.changed('serialNumber')) {
        equipment.serialNumber = equipment.serialNumber.toString().toUpperCase().trim();
      }
    }
  }
});

// Instance methods
Equipment.prototype.getFormattedCost = function() {
  if (!this.cost) return '$0';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: this.currency || 'MXN'
  }).format(this.cost);
};

Equipment.prototype.needsMaintenance = function(warningDays = 30) {
  if (!this.lastMaintenance || !this.maintenanceInterval) {
    return { needed: true, overdue: true, message: 'Sin fecha de último mantenimiento' };
  }
  
  const lastDate = new Date(this.lastMaintenance);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + this.maintenanceInterval);
  
  const today = new Date();
  const warningDate = new Date(nextDate);
  warningDate.setDate(warningDate.getDate() - warningDays);
  
  const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
  
  return {
    needed: today >= warningDate,
    overdue: today > nextDate,
    daysUntil,
    nextMaintenanceDate: nextDate.toISOString().split('T')[0]
  };
};

Equipment.prototype.getAge = function() {
  if (!this.installDate && !this.purchaseDate) return null;
  
  const referenceDate = new Date(this.installDate || this.purchaseDate);
  const today = new Date();
  
  const diffTime = Math.abs(today - referenceDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);
  
  if (diffYears > 0) {
    return `${diffYears} año${diffYears > 1 ? 's' : ''}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
  } else {
    return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
};

Equipment.prototype.toJSON = function() {
  const equipment = { ...this.get() };
  delete equipment.deletedAt;
  
  // Add calculated fields
  equipment.formattedCost = this.getFormattedCost();
  equipment.maintenanceStatus = this.needsMaintenance();
  equipment.age = this.getAge();
  
  return equipment;
};

module.exports = Equipment;
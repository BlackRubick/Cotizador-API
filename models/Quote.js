// models/Quote.js - CORREGIDO para clientId opcional
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  folio: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'clients',
      key: 'id'
    }
  },
  clientInfoName: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  clientInfoContact: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  clientInfoEmail: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  clientInfoPhone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  clientInfoAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  clientInfoPosition: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  products: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  tax: {
    type: DataTypes.DECIMAL(4, 4),
    allowNull: false,
    defaultValue: 0.16
  },
  taxAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.ENUM('MXN', 'USD', 'EUR'),
    defaultValue: 'MXN'
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'pending', 'confirmed', 'rejected', 'cancelled', 'expired'),
    defaultValue: 'draft'
  },
  termsPaymentConditions: {
    type: DataTypes.TEXT,
    defaultValue: '100% Anticipado a la entrega. (Transferencia Bancaria)'
  },
  termsDeliveryTime: {
    type: DataTypes.STRING(100),
    defaultValue: '15 días hábiles'
  },
  termsWarranty: {
    type: DataTypes.TEXT,
    defaultValue: 'Garantía: 12 meses sobre defectos de fabricación.'
  },
  termsObservations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  termsValidUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'quotes',
  hooks: {
    beforeCreate: async (quote) => {
      // Generate folio if not provided
      if (!quote.folio) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Find the last quote of the day
        const lastQuote = await Quote.findOne({
          where: {
            folio: {
              [sequelize.Sequelize.Op.like]: `BHL${day}${month}${year}%`
            }
          },
          order: [['folio', 'DESC']]
        });
        
        let sequence = 1;
        if (lastQuote) {
          const lastSequence = parseInt(lastQuote.folio.slice(-1));
          sequence = lastSequence + 1;
        }
        
        quote.folio = `BHL${day}${month}${year}C${sequence}`;
      }
      
      // Calculate totals
      if (quote.products && Array.isArray(quote.products)) {
        quote.subtotal = quote.products.reduce((sum, product) => sum + (product.totalPrice || 0), 0);
        quote.taxAmount = quote.subtotal * quote.tax;
        quote.total = quote.subtotal + quote.taxAmount;
      }
    },
    
    beforeUpdate: (quote) => {
      // Recalculate totals if products changed
      if (quote.changed('products') && quote.products && Array.isArray(quote.products)) {
        quote.subtotal = quote.products.reduce((sum, product) => sum + (product.totalPrice || 0), 0);
        quote.taxAmount = quote.subtotal * quote.tax;
        quote.total = quote.subtotal + quote.taxAmount;
      }
    }
  }
});

// Instance method for formatted date
Quote.prototype.getFormattedDate = function() {
  return this.createdAt.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

module.exports = Quote;
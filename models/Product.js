const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Product code is required' }
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Product name is required' },
      len: {
        args: [1, 200],
        msg: 'Name cannot exceed 200 characters'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Description is required' },
      len: {
        args: [1, 500],
        msg: 'Description cannot exceed 500 characters'
      }
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    validate: {
      notEmpty: { msg: 'Category is required' }
    }
  },
  categoryName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category name is required' }
    }
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Brand is required' },
      len: {
        args: [1, 100],
        msg: 'Brand cannot exceed 100 characters'
      }
    }
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Base price is required' },
      min: {
        args: [0],
        msg: 'Price cannot be negative'
      }
    }
  },
  currency: {
    type: DataTypes.ENUM('MXN', 'USD', 'EUR'),
    defaultValue: 'MXN'
  },
  compatibility: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    validate: {
      isValidCompatibility(value) {
        if (value && Array.isArray(value)) {
          const validOptions = ['ADULTO', 'PEDIÁTRICO', 'NEONATAL', 'HOSPITAL', 'CLÍNICA', 'AMBULANCIA', 'LABORATORIO'];
          const invalid = value.filter(item => !validOptions.includes(item));
          if (invalid.length > 0) {
            throw new Error(`Invalid compatibility options: ${invalid.join(', ')}`);
          }
        }
      }
    }
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of image objects with filename, originalName, path, url, size, mimetype'
  },
  accessories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of accessory objects with name, code, price, included'
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Stock quantity cannot be negative'
      }
    }
  },
  stockMinStock: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    validate: {
      min: {
        args: [0],
        msg: 'Min stock cannot be negative'
      }
    }
  },
  stockLocation: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'discontinued'),
    defaultValue: 'active'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of string tags'
  },
  supplierName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  supplierContact: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  supplierEmail: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Please enter a valid supplier email'
      }
    }
  },
  supplierPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  warrantyDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    comment: 'Warranty duration in months'
  },
  warrantyType: {
    type: DataTypes.STRING(50),
    defaultValue: 'manufacturer'
  },
  warrantyDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  lastUpdatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: {
        args: [0],
        msg: 'Sales count cannot be negative'
      }
    }
  },
  lastSaleDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['name']
    },
    {
      fields: ['categoryId']
    },
    {
      fields: ['brand']
    },
    {
      fields: ['status']
    },
    {
      fields: ['basePrice']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeSave: (product) => {
      // Ensure code is uppercase and trimmed
      if (product.code) {
        product.code = product.code.toString().toUpperCase().trim();
      }
      
      // Trim name and brand
      if (product.name) {
        product.name = product.name.toString().trim();
      }
      if (product.brand) {
        product.brand = product.brand.toString().trim();
      }
    }
  }
});

// Instance methods
Product.prototype.getFormattedPrice = function() {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: this.currency || 'MXN'
  }).format(this.basePrice);
};

Product.prototype.isInStock = function() {
  return this.stockQuantity > 0;
};

Product.prototype.isLowStock = function() {
  return this.stockQuantity <= this.stockMinStock;
};

// Virtual getter for formatted price (similar to Mongoose virtual)
Product.prototype.getVirtualFormattedPrice = function() {
  return this.getFormattedPrice();
};

// Static method to find products by compatibility
Product.findByCompatibility = function(compatibility) {
  return this.findAll({
    where: sequelize.where(
      sequelize.fn('JSON_CONTAINS', sequelize.col('compatibility'), JSON.stringify(compatibility)),
      true
    )
  });
};

// Static method for text search (similar to MongoDB text index)
Product.searchByText = function(searchTerm) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
        { brand: { [Op.like]: `%${searchTerm}%` } },
        { code: { [Op.like]: `%${searchTerm}%` } }
      ]
    }
  });
};

// Remove sensitive data from JSON output
Product.prototype.toJSON = function() {
  const product = { ...this.get() };
  delete product.deletedAt;
  
  // Add virtual formatted price
  product.formattedPrice = this.getFormattedPrice();
  
  return product;
};

module.exports = Product;
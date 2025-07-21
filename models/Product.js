// models/Product.js - Simplificado con solo tus campos específicos
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
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // ========== TUS CAMPOS ESPECÍFICOS DE NEGOCIO ==========
  
  servicio: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Tipo de servicio al que pertenece el producto'
  },
  especialidad: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Especialidad médica a la que está dirigido'
  },
  clasificacion: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Clasificación del producto'
  },
  paraDescripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'para_descripcion',
    comment: 'Descripción de para qué sirve el producto'
  },
  item: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Descripción específica del item'
  },
  cantidadPaquete: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'cantidad_paquete',
    validate: {
      min: {
        args: [1],
        msg: 'Cantidad por paquete debe ser al menos 1'
      }
    },
    comment: 'Cantidad de unidades por paquete'
  },
  moneda: {
    type: DataTypes.ENUM('MXN', 'USD', 'EUR'),
    defaultValue: 'MXN',
    comment: 'Moneda del producto'
  },
  costo: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: [0],
        msg: 'Costo no puede ser negativo'
      }
    },
    comment: 'Costo total del producto'
  },
  costoUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'costo_unitario',
    validate: {
      min: {
        args: [0],
        msg: 'Costo unitario no puede ser negativo'
      }
    },
    comment: 'Costo por unidad individual'
  },
  caducidad: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de caducidad del producto'
  },
  almacen: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ubicación en almacén'
  },
  proveedor: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Nombre del proveedor principal'
  },
  uso: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Descripción del uso del producto'
  },
  almacenEn: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'almacen_en',
    comment: 'Condiciones de almacenamiento'
  },
  incluye: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Qué incluye el producto o paquete'
  },
  impuestos: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 16.00,
    validate: {
      min: {
        args: [0],
        msg: 'Impuestos no pueden ser negativos'
      },
      max: {
        args: [100],
        msg: 'Impuestos no pueden exceder 100%'
      }
    },
    comment: 'Porcentaje de impuestos (IVA, etc.)'
  },
  factoryPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'factory_price',
    validate: {
      min: {
        args: [0],
        msg: 'Precio de fábrica no puede ser negativo'
      }
    },
    comment: 'Precio de fábrica original'
  },
  landedFactor: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 1.0000,
    field: 'landed_factor',
    validate: {
      min: {
        args: [0],
        msg: 'Factor landed no puede ser negativo'
      }
    },
    comment: 'Factor para calcular precio landed (incluyendo shipping, etc.)'
  },
  marginFactor: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 1.0000,
    field: 'margin_factor',
    validate: {
      min: {
        args: [0],
        msg: 'Factor de margen no puede ser negativo'
      }
    },
    comment: 'Factor de margen de ganancia'
  },
  valorMoneda: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 1.0000,
    field: 'valor_moneda',
    validate: {
      min: {
        args: [0],
        msg: 'Valor de moneda no puede ser negativo'
      }
    },
    comment: 'Factor de conversión de moneda'
  },
  comisionVenta: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'comision_venta',
    validate: {
      min: {
        args: [0],
        msg: 'Comisión no puede ser negativa'
      },
      max: {
        args: [100],
        msg: 'Comisión no puede exceder 100%'
      }
    },
    comment: 'Porcentaje de comisión de venta'
  },
  precioVentaPaquete: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'precio_venta_paquete',
    validate: {
      min: {
        args: [0],
        msg: 'Precio de venta por paquete no puede ser negativo'
      }
    },
    comment: 'Precio de venta por paquete completo'
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'precio_unitario',
    validate: {
      min: {
        args: [0],
        msg: 'Precio unitario no puede ser negativo'
      }
    },
    comment: 'Precio de venta por unidad individual'
  }
}, {
  tableName: 'products',
  timestamps: true,
  paranoid: true, // Para soft deletes
  indexes: [
    { fields: ['code'] },
    { fields: ['servicio'] },
    { fields: ['especialidad'] },
    { fields: ['clasificacion'] },
    { fields: ['item'] },
    { fields: ['proveedor'] },
    { fields: ['almacen'] },
    { fields: ['factoryPrice'] },
    { fields: ['precioVentaPaquete'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeSave: (product) => {
      // Ensure code is uppercase and trimmed
      if (product.code) {
        product.code = product.code.toString().toUpperCase().trim();
      }
      
      // Calcular precio unitario si no está definido
      if (product.precioVentaPaquete && product.cantidadPaquete && !product.precioUnitario) {
        product.precioUnitario = product.precioVentaPaquete / product.cantidadPaquete;
      }
      
      // Calcular costo unitario si no está definido
      if (product.costo && product.cantidadPaquete && !product.costoUnitario) {
        product.costoUnitario = product.costo / product.cantidadPaquete;
      }
    }
  }
});

// Instance methods
Product.prototype.getFormattedPrice = function() {
  const price = this.precioVentaPaquete || 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: this.moneda || 'MXN'
  }).format(price);
};

Product.prototype.getFormattedUnitPrice = function() {
  const price = this.precioUnitario || (this.precioVentaPaquete / (this.cantidadPaquete || 1));
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: this.moneda || 'MXN'
  }).format(price);
};

Product.prototype.isExpired = function() {
  if (!this.caducidad) return false;
  return new Date(this.caducidad) < new Date();
};

Product.prototype.isNearExpiry = function(days = 30) {
  if (!this.caducidad) return false;
  const expiryDate = new Date(this.caducidad);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + days);
  return expiryDate <= warningDate;
};

// Calcular precio final con todos los factores
Product.prototype.calculateFinalPrice = function() {
  if (!this.factoryPrice) return this.precioVentaPaquete || 0;
  
  let price = this.factoryPrice;
  price *= this.landedFactor || 1;
  price *= this.marginFactor || 1;
  price *= this.valorMoneda || 1;
  
  // Agregar comisión
  if (this.comisionVenta) {
    price *= (1 + (this.comisionVenta / 100));
  }
  
  return price;
};

// Static method for text search
Product.searchByText = function(searchTerm) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { code: { [Op.like]: `%${searchTerm}%` } },
        { item: { [Op.like]: `%${searchTerm}%` } },
        { servicio: { [Op.like]: `%${searchTerm}%` } },
        { especialidad: { [Op.like]: `%${searchTerm}%` } },
        { clasificacion: { [Op.like]: `%${searchTerm}%` } },
        { paraDescripcion: { [Op.like]: `%${searchTerm}%` } },
        { proveedor: { [Op.like]: `%${searchTerm}%` } }
      ]
    }
  });
};

// Remove sensitive data from JSON output and add calculated fields
Product.prototype.toJSON = function() {
  const product = { ...this.get() };
  delete product.deletedAt;
  
  // Add virtual fields for frontend compatibility
  product.name = product.item || product.code;
  product.description = product.paraDescripcion || product.uso || '';
  product.brand = product.proveedor || 'N/A';
  product.basePrice = product.precioVentaPaquete || product.precioUnitario || 0;
  product.category = product.servicio || 'General';
  product.categoryName = product.especialidad || product.servicio || 'General';
  product.compatibility = [product.clasificacion].filter(Boolean);
  
  // Add calculated fields
  product.formattedPrice = this.getFormattedPrice();
  product.formattedUnitPrice = this.getFormattedUnitPrice();
  product.finalPrice = this.calculateFinalPrice();
  product.isExpired = this.isExpired();
  product.isNearExpiry = this.isNearExpiry();
  
  // Stock info (dummy for now)
  product.stock = {
    quantity: 100, // Podrías agregar este campo si lo necesitas
    minStock: 10,
    location: product.almacen,
    isInStock: true,
    isLowStock: false
  };
  
  return product;
};

module.exports = Product;
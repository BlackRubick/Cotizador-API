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
  
  // ========== AGREGADO: Relación con Category ==========
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    },
    comment: 'Relación con tabla categories'
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
    { fields: ['categoryId'] },
    { fields: ['servicio'] },
    { fields: ['especialidad'] },
    { fields: ['clasificacion'] },
    { fields: ['item'] },
    { fields: ['proveedor'] },
    { fields: ['almacen'] },
    { fields: ['factory_price'] },
    { fields: ['precio_venta_paquete'] },
    { fields: ['createdAt'] }
  ],
  hooks: {
    beforeSave: (product) => {
      // Ensure code is uppercase and trimmed
      if (product.code) {
        product.code = product.code.toString().toUpperCase().trim();
      }
      
      // ========== AGREGADO: Corregir códigos de moneda inválidos ==========
      if (product.moneda) {
        const currencyMap = {
          'MX': 'MXN',
          'US': 'USD', 
          'EU': 'EUR',
          'mx': 'MXN',
          'us': 'USD',
          'eu': 'EUR'
        };
        
        if (currencyMap[product.moneda]) {
          product.moneda = currencyMap[product.moneda];
          console.log(`🔄 Corrected currency from ${product.moneda} to ${currencyMap[product.moneda]} for product ${product.code}`);
        } else if (!product.moneda || product.moneda.length !== 3) {
          console.log(`🔄 Invalid currency ${product.moneda} set to MXN for product ${product.code}`);
          product.moneda = 'MXN';
        }
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

// ========== CORREGIDO: Instance methods con validación de moneda ==========
Product.prototype.getFormattedPrice = function() {
  try {
    // Validar y corregir código de moneda
    let currency = this.moneda || 'MXN';
    
    // Mapear códigos de moneda inválidos a válidos
    const currencyMap = {
      'MX': 'MXN',
      'US': 'USD', 
      'EU': 'EUR',
      'mx': 'MXN',
      'us': 'USD',
      'eu': 'EUR'
    };
    
    // Corregir si es un código inválido
    if (currencyMap[currency]) {
      currency = currencyMap[currency];
    }
    
    // Validar que sea un código válido (3 caracteres)
    if (!currency || currency.length !== 3) {
      currency = 'MXN'; // Fallback por defecto
    }
    
    const price = this.precioVentaPaquete || 0;
    
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(price);
    
  } catch (error) {
    console.warn('⚠️ Error formatting price for product', this.code, '- Currency:', this.moneda, 'Error:', error.message);
    // Fallback seguro
    const price = this.precioVentaPaquete || 0;
    return `$${price.toFixed(2)} MXN`;
  }
};

Product.prototype.getFormattedUnitPrice = function() {
  try {
    // Misma validación para precio unitario
    let currency = this.moneda || 'MXN';
    
    const currencyMap = {
      'MX': 'MXN',
      'US': 'USD', 
      'EU': 'EUR',
      'mx': 'MXN',
      'us': 'USD',
      'eu': 'EUR'
    };
    
    if (currencyMap[currency]) {
      currency = currencyMap[currency];
    }
    
    if (!currency || currency.length !== 3) {
      currency = 'MXN';
    }
    
    const price = this.precioUnitario || (this.precioVentaPaquete / (this.cantidadPaquete || 1));
    
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(price);
    
  } catch (error) {
    console.warn('⚠️ Error formatting unit price for product', this.code, '- Currency:', this.moneda);
    const price = this.precioUnitario || (this.precioVentaPaquete / (this.cantidadPaquete || 1));
    return `$${price.toFixed(2)} MXN`;
  }
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

// ========== CORREGIDO: toJSON con manejo seguro de errores ==========
Product.prototype.toJSON = function() {
  const product = { ...this.get() };
  delete product.deletedAt;
  
  // Add virtual fields for frontend compatibility
  product.name = product.item || product.code;
  product.description = product.paraDescripcion || product.uso || '';
  product.brand = product.proveedor || 'N/A';
  product.basePrice = product.precioVentaPaquete || product.precioUnitario || 0;
  
  // ========== CORREGIDO: category y categoryName ==========
  if (this.category) {
    product.category = this.category.name;
    product.categoryName = this.category.name;
  } else {
    product.category = product.servicio || 'General';
    product.categoryName = product.especialidad || product.servicio || 'General';
  }
  
  product.compatibility = [product.clasificacion].filter(Boolean);
  
  // ========== CORREGIDO: Add calculated fields con manejo de errores ==========
  try {
    product.formattedPrice = this.getFormattedPrice();
  } catch (error) {
    console.warn('⚠️ Error in formattedPrice for product', this.code);
    product.formattedPrice = `$${product.basePrice || 0} MXN`;
  }
  
  try {
    product.formattedUnitPrice = this.getFormattedUnitPrice();
  } catch (error) {
    console.warn('⚠️ Error in formattedUnitPrice for product', this.code);
    const unitPrice = product.precioUnitario || (product.basePrice / (product.cantidadPaquete || 1));
    product.formattedUnitPrice = `$${unitPrice.toFixed(2)} MXN`;
  }
  
  product.finalPrice = this.calculateFinalPrice();
  product.isExpired = this.isExpired();
  product.isNearExpiry = this.isNearExpiry();
  
  // Stock info (dummy for now)
  product.stock = {
    quantity: 100,
    minStock: 10,
    location: product.almacen,
    isInStock: true,
    isLowStock: false
  };
  
  return product;
};

// ========== AGREGADO: Associations ==========
Product.associate = (models) => {
  // Relación con User (creador)
  Product.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  // Relación con Category
  Product.belongsTo(models.Category, {
    foreignKey: 'categoryId',
    as: 'category'
  });
};

module.exports = Product;
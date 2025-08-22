// models/index.js - ACTUALIZADO con Equipment
const sequelize = require('../config/database');

// Importar todos los modelos
const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Client = require('./Client');
const Quote = require('./Quote');
const Equipment = require('./Equipment'); 

// Configurar solo las asociaciones que NO están en los modelos individuales
// ========================================================================

// User associations (estas NO están en User.js)
User.hasMany(Product, { foreignKey: 'createdBy', as: 'products' });
User.hasMany(Category, { foreignKey: 'createdBy', as: 'categories' });
User.hasMany(Client, { foreignKey: 'createdBy', as: 'clients' });
User.hasMany(Quote, { foreignKey: 'createdBy', as: 'quotes' });
User.hasMany(Equipment, { foreignKey: 'createdBy', as: 'equipment' }); 

// Product associations (estas NO están en Product.js)
Product.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Category associations adicionales (hasMany Products y belongsTo User NO están en Category.js)
Category.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
// NOTA: Category ya tiene las asociaciones parentCategory y subcategories en Category.js

// Client associations (estas NO están en Client.js)
Client.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Client.hasMany(Quote, { foreignKey: 'clientId', as: 'quotes' });
Client.hasMany(Equipment, { foreignKey: 'clientId', as: 'equipment' }); 

// Quote associations (estas NO están en Quote.js)
Quote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Quote.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Equipment associations (nuevas asociaciones)
Equipment.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Equipment.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

module.exports = {
  sequelize,
  User,
  Product,
  Category,
  Client,
  Quote,
  Equipment 
};
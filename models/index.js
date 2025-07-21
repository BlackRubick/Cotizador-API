const sequelize = require('../config/database');
const User = require('./User');
const Client = require('./Client');
const Category = require('./Category');
const Product = require('./Product');
const Quote = require('./Quote');

// Define associations
User.hasMany(Client, { foreignKey: 'createdBy', as: 'clients' });
Client.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Category, { foreignKey: 'createdBy', as: 'categories' });
Category.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Product, { foreignKey: 'createdBy', as: 'createdProducts' });
Product.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(Product, { foreignKey: 'lastUpdatedBy', as: 'updatedProducts' });
Product.belongsTo(User, { foreignKey: 'lastUpdatedBy', as: 'lastUpdater' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Client.hasMany(Quote, { foreignKey: 'clientId', as: 'quotes' });
Quote.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

User.hasMany(Quote, { foreignKey: 'createdBy', as: 'quotes' });
Quote.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Client,
  Category,
  Product,
  Quote
};
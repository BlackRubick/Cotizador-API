// models/index.js - Simplificado para trabajar solo con Users y Products
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');

// Define associations
User.hasMany(Product, { foreignKey: 'createdBy', as: 'products' });
Product.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  sequelize,
  User,
  Product
};
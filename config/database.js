const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cotizador',
  process.env.DB_USER || 'cotizador_user',
  process.env.DB_PASSWORD || 'cesar',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      paranoid: true, // Soft deletes
      freezeTableName: false
    },
    timezone: '-06:00' // Adjust for your timezone
  }
);

module.exports = sequelize;
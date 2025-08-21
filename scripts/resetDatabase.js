// scripts/resetDatabase.js - Script para resetear la base de datos
const sequelize = require('../config/database');
const { User, Product, Category, Client, Quote } = require('../models');
require('dotenv').config();

const resetDatabase = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    console.log('⚠️  ADVERTENCIA: Esto eliminará TODAS las tablas y datos existentes');
    console.log('🔄 Eliminando todas las tablas...');

    // Deshabilitar foreign key checks temporalmente
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Eliminar todas las tablas si existen
    await sequelize.drop();
    console.log('🗑️  Todas las tablas eliminadas');

    // Volver a habilitar foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('🔧 Creando todas las tablas de nuevo...');
    
    // Crear todas las tablas con sus relaciones
    await sequelize.sync({ force: true });
    
    console.log('✅ Base de datos reseteada exitosamente');
    console.log('📋 Tablas creadas:');
    
    // Mostrar todas las tablas creadas
    const tables = await sequelize.getQueryInterface().showAllTables();
    tables.forEach(table => {
      console.log(`   - ${table}`);
    });

    console.log('\n🎉 Base de datos lista para usar');
    console.log('💡 Próximo paso: Crear usuario admin');
    console.log('   Comando: node scripts/createAdminUser.js');

  } catch (error) {
    console.error('❌ Error reseteando base de datos:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('✅ Reset completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el reset:', error);
      process.exit(1);
    });
}

module.exports = { resetDatabase };
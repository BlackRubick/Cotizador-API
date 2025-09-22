const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

async function runMigration() {
  try {
    console.log('🔄 Starting migration process...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Cargar el archivo de migración
    const migrationPath = path.join(__dirname, '../migrations/migracion.js');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Migration file not found!');
    }

    const migration = require(migrationPath);
    
    // Ejecutar la migración
    await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('🎉 Migration executed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
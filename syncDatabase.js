const sequelize = require('./config/database');
const { User, Product, Category, Client, Quote, Equipment } = require('./models');

const syncDatabase = async () => {
  try {
    console.log('🔄 Iniciando sincronización de base de datos...');
    
    // Verificar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente');
    
    // Mostrar modelos cargados
    console.log('📋 Modelos disponibles:', Object.keys(sequelize.models));
    
    // Sincronizar base de datos (crear/actualizar tablas)
    await sequelize.sync({ 
      force: false,  // Cambia a true si quieres recrear todas las tablas (CUIDADO: borra datos)
      alter: true    // Modifica las tablas existentes para coincidir con los modelos
    });
    
    console.log('✅ Base de datos sincronizada correctamente');
    console.log('📊 Tablas creadas/actualizadas:');
    console.log('   - Users (usuarios)');
    console.log('   - Categories (categorías)');
    console.log('   - Products (productos)');
    console.log('   - Clients (clientes)');
    console.log('   - Equipment (equipos)');
    console.log('   - Quotes (cotizaciones)');
    
    // Verificar que las tablas existen
    const tableNames = await sequelize.getQueryInterface().showAllTables();
    console.log('🗂️  Tablas en la base de datos:', tableNames);
    
    console.log('🎉 Sincronización completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cerrar conexión
    await sequelize.close();
    console.log('🔐 Conexión cerrada');
  }
};

// Ejecutar el script si se llama directamente
if (require.main === module) {
  syncDatabase();
}

module.exports = syncDatabase;
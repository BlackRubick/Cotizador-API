'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🔄 Adding hospital fields to clients table...');
    
    try {
      // Verificar si la tabla clients existe
      const tableExists = await queryInterface.tableExists('clients');
      if (!tableExists) {
        console.log('⚠️ Clients table does not exist, skipping migration');
        return;
      }

      // Agregar columnas una por una con verificación
      const columns = [
        { name: 'hospital_name', type: Sequelize.STRING(200), comment: 'Nombre específico del hospital' },
        { name: 'dependencia', type: Sequelize.STRING(200), comment: 'Dependencia del hospital' },
        { name: 'contrato', type: Sequelize.STRING(100), comment: 'Número de contrato' },
        { name: 'equipment_name', type: Sequelize.STRING(200), comment: 'Nombre del equipo médico' },
        { name: 'equipment_brand', type: Sequelize.STRING(100), comment: 'Marca del equipo' },
        { name: 'equipment_model', type: Sequelize.STRING(100), comment: 'Modelo del equipo' },
        { name: 'serial_number', type: Sequelize.STRING(100), comment: 'Número de serie del equipo' },
        { name: 'installation_date', type: Sequelize.DATEONLY, comment: 'Fecha de instalación del equipo' },
        { name: 'last_maintenance', type: Sequelize.DATEONLY, comment: 'Fecha del último mantenimiento' },
        { name: 'status_april_2025', type: Sequelize.STRING(100), comment: 'Estatus para abril 2025' },
        { name: 'status_start_2026', type: Sequelize.STRING(100), comment: 'Estatus para inicio 2026' }
      ];

      for (const column of columns) {
        try {
          // Verificar si la columna ya existe
          const tableDescription = await queryInterface.describeTable('clients');
          
          if (!tableDescription[column.name]) {
            await queryInterface.addColumn('clients', column.name, {
              type: column.type,
              allowNull: true,
              comment: column.comment
            });
            console.log(`✅ Added column: ${column.name}`);
          } else {
            console.log(`⏭️ Column ${column.name} already exists, skipping`);
          }
        } catch (error) {
          console.error(`❌ Error adding column ${column.name}:`, error.message);
        }
      }

      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🔄 Removing hospital fields from clients table...');
    
    try {
      const columns = [
        'hospital_name', 'dependencia', 'contrato', 'equipment_name', 
        'equipment_brand', 'equipment_model', 'serial_number', 
        'installation_date', 'last_maintenance', 'status_april_2025', 'status_start_2026'
      ];

      for (const columnName of columns) {
        try {
          const tableDescription = await queryInterface.describeTable('clients');
          
          if (tableDescription[columnName]) {
            await queryInterface.removeColumn('clients', columnName);
            console.log(`✅ Removed column: ${columnName}`);
          }
        } catch (error) {
          console.error(`❌ Error removing column ${columnName}:`, error.message);
        }
      }

      console.log('✅ Rollback completed successfully!');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};
// scripts/setupEquipmentDatabase.js - Script para configurar la base de datos de equipos
const sequelize = require('../config/database');
const { User, Client, Equipment } = require('../models');
require('dotenv').config();

const setupEquipmentDatabase = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    console.log('🔧 Sincronizando modelo Equipment...');
    await Equipment.sync({ force: false, alter: true });
    console.log('✅ Tabla equipment sincronizada');

    // Verificar que existen usuarios y clientes para testing
    const userCount = await User.count();
    const clientCount = await Client.count();
    
    console.log(`👥 Usuarios en la base de datos: ${userCount}`);
    console.log(`🏥 Clientes en la base de datos: ${clientCount}`);

    if (userCount === 0) {
      console.log('⚠️  No hay usuarios. Ejecuta: node scripts/createAdminUser.js');
    }

    if (clientCount === 0) {
      console.log('⚠️  No hay clientes. Crea algunos clientes primero.');
    }

    // Crear algunos equipos de ejemplo si no existen
    const equipmentCount = await Equipment.count();
    console.log(`🔧 Equipos existentes: ${equipmentCount}`);

    if (equipmentCount === 0 && userCount > 0 && clientCount > 0) {
      console.log('📋 Creando equipos de ejemplo...');
      
      const adminUser = await User.findOne({ where: { role: 'admin' } });
      const firstClient = await Client.findOne();

      if (adminUser && firstClient) {
        const sampleEquipment = [
          {
            name: 'Monitor de Signos Vitales',
            model: 'CARESCAPE B450',
            serialNumber: 'GE2023001',
            category: 'Monitoreo',
            brand: 'General Electric',
            location: 'UCI - Habitación 101',
            installDate: '2023-01-15',
            lastMaintenance: '2024-06-15',
            maintenanceInterval: 6,
            status: 'active',
            specifications: [
              'Pantalla táctil de 15 pulgadas',
              'Monitoreo ECG de 12 derivaciones',
              'SpO2, NIBP, Temperatura',
              'Conectividad WiFi'
            ],
            cost: 85000,
            currency: 'MXN',
            supplier: 'GE Healthcare México',
            clientId: firstClient.id,
            createdBy: adminUser.id
          },
          {
            name: 'Ventilador Mecánico',
            model: 'Hamilton C3',
            serialNumber: 'HAM2023002',
            category: 'Ventilación',
            brand: 'Hamilton Medical',
            location: 'UCI - Habitación 102',
            installDate: '2023-03-20',
            lastMaintenance: '2024-03-20',
            maintenanceInterval: 12,
            status: 'active',
            specifications: [
              'Ventilación invasiva y no invasiva',
              'Pantalla táctil 15 pulgadas',
              'Modos avanzados de ventilación',
              'Batería de respaldo 4 horas'
            ],
            cost: 250000,
            currency: 'MXN',
            supplier: 'Hamilton Medical México',
            clientId: firstClient.id,
            createdBy: adminUser.id
          },
          {
            name: 'Desfibrilador/Monitor',
            model: 'LifePak 15',
            serialNumber: 'LP2023003',
            category: 'Emergencia',
            brand: 'Physio-Control',
            location: 'Urgencias - Sala de Trauma',
            installDate: '2023-05-10',
            lastMaintenance: '2024-05-10',
            maintenanceInterval: 12,
            status: 'maintenance',
            specifications: [
              'Desfibrilación manual y automática',
              'Monitoreo ECG de 12 derivaciones',
              'SpO2, NIBP, CO2',
              'Impresora térmica integrada'
            ],
            cost: 120000,
            currency: 'MXN',
            supplier: 'Stryker México',
            notes: 'En mantenimiento preventivo programado',
            clientId: firstClient.id,
            createdBy: adminUser.id
          }
        ];

        for (const equipmentData of sampleEquipment) {
          const equipment = await Equipment.create(equipmentData);
          console.log(`✅ Creado: ${equipment.name} (${equipment.serialNumber})`);
        }

        console.log('🎉 Equipos de ejemplo creados exitosamente');
      }
    }

    // Mostrar estadísticas finales
    const finalStats = await Equipment.findAll({
      attributes: [
        'status',
        [Equipment.sequelize.fn('COUNT', Equipment.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    console.log('\n📊 Estadísticas de equipos por estado:');
    finalStats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat.get('count')} equipos`);
    });

    const totalEquipment = await Equipment.count();
    console.log(`\n🔧 Total de equipos: ${totalEquipment}`);

    console.log('\n🎉 Setup de Equipment completado');
    console.log('🔗 Endpoints disponibles:');
    console.log('   GET /api/clients/:clientId/equipment - Obtener equipos de un cliente');
    console.log('   POST /api/clients/:clientId/equipment - Crear equipo para un cliente');
    console.log('   GET /api/equipment/:id - Obtener equipo específico');
    console.log('   PUT /api/equipment/:id - Actualizar equipo');
    console.log('   DELETE /api/equipment/:id - Eliminar equipo');
    console.log('   GET /api/equipment/categories - Obtener categorías');
    console.log('   GET /api/equipment/brands - Obtener marcas');
    console.log('   GET /api/equipment/stats - Estadísticas');
    console.log('   GET /api/equipment/maintenance-alerts - Alertas de mantenimiento');

  } catch (error) {
    console.error('❌ Error en setup de Equipment:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  setupEquipmentDatabase()
    .then(() => {
      console.log('✅ Setup completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el setup:', error);
      process.exit(1);
    });
}

module.exports = { setupEquipmentDatabase };
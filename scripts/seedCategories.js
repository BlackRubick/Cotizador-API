// scripts/seedCategories.js - Script para crear categorías
const { Category, User } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

// Categorías basadas en tu estructura de productos
const categories = [
  {
    name: 'ELECTRODO',
    description: 'Electrodos desechables y reutilizables para monitoreo cardiaco',
    sortOrder: 1
  },
  {
    name: 'PARCHES',
    description: 'Parches adhesivos para fijación de sensores y electrodos',
    sortOrder: 2
  },
  {
    name: 'BRAZALETE BP',
    description: 'Brazaletes para medición de presión arterial (adulto, pediátrico, neonatal)',
    sortOrder: 3
  },
  {
    name: 'SENSOR',
    description: 'Sensores de temperatura, SpO2, presión y otros parámetros vitales',
    sortOrder: 4
  },
  {
    name: 'Componentes de interconexión',
    description: 'Cables, adaptadores y componentes para interconexión de equipos',
    sortOrder: 5
  },
  {
    name: 'SONDA',
    description: 'Sondas y transductores para mediciones especializadas',
    sortOrder: 6
  },
  {
    name: 'CIRCUITO PACIENTE',
    description: 'Circuitos y tubos para ventilación y otros sistemas de soporte vital',
    sortOrder: 7
  },
  {
    name: 'ACCESORIO',
    description: 'Accesorios diversos para equipos médicos',
    sortOrder: 8
  }
];

const seedCategories = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    // Verificar que existe un usuario admin
    let adminUser = await User.findOne({ where: { role: 'admin' } });
    
    if (!adminUser) {
      console.log('👤 Creando usuario admin...');
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@cotizador.com',
        password: 'admin123',
        firstName: 'Administrador',
        lastName: 'Sistema',
        phone: '+529611234567',
        role: 'admin',
        position: 'Administrador del Sistema'
      });
    }

    console.log('🗑️  Limpiando categorías existentes...');
    await Category.destroy({ where: {}, force: true });

    console.log('📁 Creando categorías...');
    
    const createdCategories = [];
    
    for (const categoryData of categories) {
      const category = await Category.create({
        ...categoryData,
        createdBy: adminUser.id,
        isActive: true
      });
      
      createdCategories.push(category);
      console.log(`✅ Creada: ${category.name} (ID: ${category.id})`);
    }

    console.log('\n🎉 Categorías creadas exitosamente!');
    console.log(`   Total: ${createdCategories.length} categorías`);

    // Mostrar resumen
    console.log('\n📋 Resumen de categorías:');
    createdCategories.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name}`);
    });

    return createdCategories;

  } catch (error) {
    console.error('❌ Error creando categorías:', error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedCategories()
    .then(() => {
      console.log('✅ Categorías creadas exitosamente');
      console.log('\n🔧 Próximo paso: Importar productos desde Excel');
      console.log('   Comando: node scripts/importProductsFromExcel.js');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en el proceso:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize.close();
    });
}

module.exports = { seedCategories, categories };
// @ts-nocheck
const sequelize = require('../config/database');
const { User, Category, Product, Client, Quote } = require('../models');
require('dotenv').config();

// Run the seeder immediately
(async () => {
  try {
    // Connect and sync database
    console.log('🔄 Connecting to MySQL...');
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');

    // Force sync (this will drop and recreate tables)
    console.log('🔄 Synchronizing database...');
    await sequelize.sync({ force: true });
    console.log('📊 Database synchronized');

    console.log('👤 Creating users...');
    
    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@cotizador.com',
      password: 'password123',
      firstName: 'Administrador',
      lastName: 'Sistema',
      phone: '+52 961 123 4567',
      role: 'admin',
      position: 'Administrador del Sistema'
    });

    // Create regular user
    const regularUser = await User.create({
      username: 'usuario',
      email: 'usuario@cotizador.com',
      password: 'password123',
      firstName: 'Juan Carlos',
      lastName: 'González',
      phone: '+52 961 234 5678',
      role: 'user',
      position: 'Ejecutivo de Ventas'
    });

    console.log('📁 Creating categories...');
    
    // Create categories
    const xprezzonCategory = await Category.create({
      name: 'XPREZZON',
      description: 'Monitores de signos vitales y equipos de monitoreo cardiaco',
      createdBy: adminUser.id,
      sortOrder: 1
    });

    const cubeCategory = await Category.create({
      name: 'CUBE',
      description: 'Sistemas de monitoreo avanzados y estaciones de trabajo',
      createdBy: adminUser.id,
      sortOrder: 2
    });

    const csuCategory = await Category.create({
      name: 'CSU',
      description: 'Unidades de control central y módulos de sistema',
      createdBy: adminUser.id,
      sortOrder: 3
    });

    console.log('📦 Creating products...');
    
    // Create products for XPREZZON
    const xprezzonProducts = await Product.bulkCreate([
      {
        code: 'VOO-XPRE-04',
        name: 'Monitor Cardiaco Estándar IV',
        description: 'Monitor cardiaco con pantalla de 15 pulgadas, incluye ECG, SpO2 y NIBP',
        categoryId: xprezzonCategory.id,
        categoryName: 'XPREZZON',
        brand: 'Mindray',
        basePrice: 15500.00,
        compatibility: ['ADULTO', 'PEDIÁTRICO', 'NEONATAL'],
        accessories: [
          { name: 'Cable ECG', code: 'ECG-001', price: 250, included: true },
          { name: 'Sensor SpO2', code: 'SPO2-001', price: 180, included: true }
        ],
        stockQuantity: 10,
        stockMinStock: 3,
        stockLocation: 'Almacén A',
        createdBy: adminUser.id
      },
      {
        code: 'VOO-XPRE-05',
        name: 'Transductor De Presión',
        description: 'Transductor de presión arterial invasiva con alta precisión',
        categoryId: xprezzonCategory.id,
        categoryName: 'XPREZZON',
        brand: 'Edwards Lifesciences',
        basePrice: 8500.00,
        compatibility: ['ADULTO', 'PEDIÁTRICO'],
        accessories: [
          { name: 'Cable de conexión', code: 'CABLE-001', price: 120, included: true }
        ],
        stockQuantity: 15,
        stockMinStock: 5,
        stockLocation: 'Almacén A',
        createdBy: adminUser.id
      },
      {
        code: 'VOO-XPRE-06',
        name: 'Set de Cables Estándar IV',
        description: 'Set completo de cables para monitoreo multiparamétrico',
        categoryId: xprezzonCategory.id,
        categoryName: 'XPREZZON',
        brand: 'Philips',
        basePrice: 3200.00,
        compatibility: ['ADULTO', 'PEDIÁTRICO', 'NEONATAL'],
        accessories: [
          { name: 'Cable ECG 5 derivaciones', code: 'ECG-5-001', price: 300, included: true },
          { name: 'Cable SpO2', code: 'SPO2-002', price: 180, included: true },
          { name: 'Cable NIBP', code: 'NIBP-001', price: 220, included: true }
        ],
        stockQuantity: 25,
        stockMinStock: 8,
        stockLocation: 'Almacén B',
        createdBy: adminUser.id
      }
    ]);

    // Create products for CUBE and CSU...
    const cubeProducts = await Product.bulkCreate([
      {
        code: 'CUBE-MON-01',
        name: 'CUBE Monitor Station',
        description: 'Estación de monitoreo CUBE con pantalla táctil de 21 pulgadas',
        categoryId: cubeCategory.id,
        categoryName: 'CUBE',
        brand: 'Drager',
        basePrice: 25000.00,
        compatibility: ['HOSPITAL', 'CLÍNICA'],
        accessories: [
          { name: 'Pantalla táctil', code: 'TOUCH-001', price: 0, included: true }
        ],
        stockQuantity: 5,
        stockMinStock: 2,
        stockLocation: 'Almacén C',
        createdBy: adminUser.id
      }
    ]);

    console.log('👥 Creating clients...');
    
    const clients = await Client.bulkCreate([
      {
        name: 'Hospital General de Tuxtla',
        contact: 'Dr. Eduardo Ramírez',
        email: 'contacto@hospitalgeneral.com',
        phone: '+52 961 234 5678',
        street: 'Av. Central 123',
        city: 'Tuxtla Gutiérrez',
        state: 'Chiapas',
        zipCode: '29000',
        country: 'México',
        rfc: 'HGT850101ABC',
        clientType: 'Hospital',
        createdBy: adminUser.id
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`   - Users: ${await User.count()}`);
    console.log(`   - Categories: ${await Category.count()}`);
    console.log(`   - Products: ${await Product.count()}`);
    console.log(`   - Clients: ${await Client.count()}`);
    console.log('\n🔑 Default login credentials:');
    console.log('   Admin: admin / password123');
    console.log('   User:  usuario / password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
})();
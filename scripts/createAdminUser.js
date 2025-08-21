// scripts/createAdminUser.js - Script para crear usuario administrador
const { User } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  Ya existe un usuario administrador:');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
      return existingAdmin;
    }

    console.log('👤 Creando usuario administrador...');

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@cotizador.com',
      password: 'admin123', // Cambiar en producción
      firstName: 'Administrador',
      lastName: 'Sistema',
      phone: '+529611234567',
      role: 'admin',
      position: 'Administrador del Sistema',
      isActive: true
    });

    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123 (⚠️  CAMBIAR EN PRODUCCIÓN)`);
    console.log(`   Role: ${adminUser.role}`);

    console.log('\n🔐 Credenciales de acceso:');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');

    return adminUser;

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('✅ Admin user creado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error creando admin:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
// scripts/createVendedorUser.js - Script para crear un usuario vendedor
const { User } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
require('dotenv').config();

// Definir el usuario vendedor a crear
const usersToCreate = [
  {
    username: 'carlos.vendedor',
    email: 'carlos.mendez@conduitlife.mx',
    firstName: 'Carlos',
    lastName: 'Méndez',
    phone: '+529612345678',
    role: 'vendedor',
    position: 'Vendedor Senior',
    password: 'Vendedor2024!' // Cambiar en producción
  }
];

const createConduitUsers = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    console.log('� Creando usuario VENDEDOR de Conduit Life...\n');

    const createdUsers = [];
    const existingUsers = [];

    for (const userData of usersToCreate) {
      try {
        // Verificar si el usuario ya existe por email o username
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { email: userData.email },
              { username: userData.username }
            ]
          }
        });

        if (existingUser) {
          console.log(`⚠️  Usuario ya existe: ${userData.email}`);
          console.log(`   Username: ${existingUser.username}`);
          console.log(`   Nombre: ${existingUser.firstName} ${existingUser.lastName}`);
          console.log(`   Role: ${existingUser.role}\n`);
          existingUsers.push(existingUser);
          continue;
        }

        // Crear el nuevo usuario
        const newUser = await User.create({
          ...userData,
          isActive: true
        });

        console.log(`✅ Usuario vendedor creado: ${userData.email}`);
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Username: ${newUser.username}`);
        console.log(`   Nombre: ${newUser.firstName} ${newUser.lastName}`);
        console.log(`   Role: ${newUser.role}`);
        console.log(`   Position: ${newUser.position}\n`);

        createdUsers.push(newUser);

      } catch (userError) {
        console.error(`❌ Error creando usuario ${userData.email}:`, userError.message);
        continue;
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE OPERACIÓN:');
    console.log(`✅ Usuarios creados: ${createdUsers.length}`);
    console.log(`⚠️  Usuarios existentes: ${existingUsers.length}`);
    
    if (createdUsers.length > 0) {
      console.log('\n🔐 CREDENCIALES DEL NUEVO VENDEDOR:');
      console.log('================================================');
      createdUsers.forEach(user => {
        console.log(`👤 ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: Vendedor2024! (⚠️  CAMBIAR EN PRODUCCIÓN)`);
        console.log(`   Role: ${user.role}`);
        console.log('   ----------------------------------------');
      });
      console.log('⚠️  IMPORTANTE: Cambiar la contraseña en producción');
    }

    return { createdUsers, existingUsers };

  } catch (error) {
    console.error('❌ Error en la operación:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createConduitUsers()
    .then(({ createdUsers, existingUsers }) => {
      console.log(`\n✅ Operación completada - Creados: ${createdUsers.length}, Existentes: ${existingUsers.length}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error creando usuario vendedor:', error);
      process.exit(1);
    });
}

module.exports = { 
  createConduitUsers,
  usersToCreate 
};
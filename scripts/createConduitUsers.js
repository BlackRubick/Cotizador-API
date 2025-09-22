// scripts/createConduitUsers.js - Script para crear usuarios de Conduit Life
const { User } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
require('dotenv').config();

// Definir los usuarios a crear - TODOS CON ROL ADMIN
const usersToCreate = [
  {
    username: 'especialistaproducto',
    email: 'especialista.producto@conduitlife.mx',
    firstName: 'Especialista',
    lastName: 'Producto',
    phone: '+529611234567',
    role: 'admin',
    position: 'Especialista en Producto',
    password: 'Conduit2024!' // Cambiar en producción
  },
  {
    username: 'alfonsoromero',
    email: 'alfonso.romero@conduitlife.mx',
    firstName: 'Alfonso',
    lastName: 'Romero',
    phone: '+529611234568',
    role: 'admin',
    position: 'Gerente',
    password: 'Conduit2024!' // Cambiar en producción
  },
  {
    username: 'josenavarrete',
    email: 'Jose.navarrete@conduitlife.mx',
    firstName: 'José',
    lastName: 'Navarrete',
    phone: '+529611234569',
    role: 'admin',
    position: 'Colaborador',
    password: 'Conduit2024!' // Cambiar en producción
  },
  {
    username: 'asistente',
    email: 'asistente@conduitlife.mx',
    firstName: 'Asistente',
    lastName: 'General',
    phone: '+529611234570',
    role: 'admin',
    position: 'Asistente Administrativo',
    password: 'Conduit2024!' // Cambiar en producción
  },
  {
    username: 'eduardonavarrete',
    email: 'eduardo.navarrete@conduitlife.mx',
    firstName: 'Eduardo',
    lastName: 'Navarrete',
    phone: '+529611234571',
    role: 'admin',
    position: 'Colaborador',
    password: 'Conduit2024!' // Cambiar en producción
  }
];

const createConduitUsers = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    console.log('👥 Creando usuarios ADMINISTRADORES de Conduit Life...\n');

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

        console.log(`✅ Usuario creado: ${userData.email}`);
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
      console.log('\n🔐 CREDENCIALES DE NUEVOS USUARIOS:');
      console.log('================================================');
      createdUsers.forEach(user => {
        console.log(`👤 ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: Conduit2024! (⚠️  CAMBIAR EN PRODUCCIÓN)`);
        console.log(`   Role: ${user.role}`);
        console.log('   ----------------------------------------');
      });
      console.log('⚠️  IMPORTANTE: Cambiar todas las contraseñas en producción');
    }

    return { createdUsers, existingUsers };

  } catch (error) {
    console.error('❌ Error en la operación:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Función para crear un usuario individual
const createSingleUser = async (userData) => {
  try {
    await sequelize.authenticate();
    
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
      return existingUser;
    }

    const newUser = await User.create({
      ...userData,
      isActive: true
    });

    console.log(`✅ Usuario creado: ${userData.email}`);
    return newUser;

  } catch (error) {
    console.error(`❌ Error creando usuario:`, error);
    throw error;
  }
};

// Función para listar usuarios de Conduit Life
const listConduitUsers = async () => {
  try {
    await sequelize.authenticate();
    
    const users = await User.findAll({
      where: {
        email: {
          [Op.like]: '%@conduitlife.mx'
        }
      },
      attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role', 'position', 'isActive', 'createdAt']
    });

    console.log('\n👥 USUARIOS DE CONDUIT LIFE:');
    console.log('================================================');
    
    if (users.length === 0) {
      console.log('No se encontraron usuarios de Conduit Life');
      return [];
    }

    users.forEach(user => {
      console.log(`👤 ${user.firstName} ${user.lastName}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Position: ${user.position}`);
      console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('   ----------------------------------------');
    });

    return users;

  } catch (error) {
    console.error('❌ Error listando usuarios:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    listConduitUsers()
      .then(() => {
        console.log('✅ Operación completada');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
  } else {
    createConduitUsers()
      .then(({ createdUsers, existingUsers }) => {
        console.log(`\n✅ Operación completada - Creados: ${createdUsers.length}, Existentes: ${existingUsers.length}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error creando usuarios:', error);
        process.exit(1);
      });
  }
}

module.exports = { 
  createConduitUsers, 
  createSingleUser, 
  listConduitUsers, 
  usersToCreate 
};
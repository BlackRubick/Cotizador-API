const { Client } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los clientes
const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, clientType, status } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contact: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { hospitalName: { [Op.like]: `%${search}%` } },
        { dependencia: { [Op.like]: `%${search}%` } },
        { equipmentName: { [Op.like]: `%${search}%` } },
        { equipmentBrand: { [Op.like]: `%${search}%` } },
        { equipmentModel: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { state: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (clientType) {
      where.clientType = clientType;
    }
    
    if (status) {
      where.status = status;
    }

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Obtener clientes con paginación
    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['deletedAt'] }
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener clientes',
      error: error.message
    });
  }
};

// Obtener un cliente por ID
const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findByPk(id, {
      attributes: { exclude: ['deletedAt'] },
      include: [
        {
          model: require('../models').User,
          as: 'creator',
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cliente',
      error: error.message
    });
  }
};

// Crear nuevo cliente
const createClient = async (req, res) => {
  try {
    console.log('📝 Creating client with data:', req.body);
    
    const {
      name,
      contact,
      email,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      rfc,
      clientType,
      notes,
      
      // ========== CAMPOS ESPECÍFICOS DE HOSPITAL ==========
      hospitalName,
      dependencia,
      contrato,
      
      // ========== INFORMACIÓN DE EQUIPO ==========
      equipmentName,
      equipmentBrand, 
      equipmentModel,
      serialNumber,
      
      // ========== FECHAS ==========
      installationDate,
      lastMaintenance,
      
      // ========== ESTATUS ==========
      statusApril2025,
      statusStart2026
    } = req.body;

    // Validaciones básicas
    if (!name || !contact || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Los campos name, contact, email y phone son requeridos'
      });
    }

    // Verificar si ya existe un cliente con el mismo email
    const existingClient = await Client.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con este email'
      });
    }

    // ========== PROCESAR DATOS DEL FRONTEND ==========
    let processedData = {
      name: name.trim(),
      contact: contact.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      street: street?.trim(),
      city: city?.trim(),
      state: state?.trim(),
      zipCode: zipCode?.trim(),
      country: country || 'México',
      rfc: (rfc && rfc.trim() && rfc.trim() !== '') ? rfc.trim().toUpperCase() : null,  // ← CORREGIDO: RFC opcional
      clientType: clientType || 'Hospital',
      notes: notes,
      
      // Campos específicos
      hospitalName: hospitalName?.trim(),
      dependencia: dependencia?.trim(),
      contrato: contrato?.trim(),
      
      // Información de equipo
      equipmentName: equipmentName?.trim(),
      equipmentBrand: equipmentBrand?.trim(),
      equipmentModel: equipmentModel?.trim(),
      serialNumber: serialNumber?.trim(),
      
      // Fechas
      installationDate: installationDate || null,
      lastMaintenance: lastMaintenance || null,
      
      // Estatus
      statusApril2025: statusApril2025?.trim(),
      statusStart2026: statusStart2026?.trim(),
      
      status: 'active',
      createdBy: req.user?.id || 1 
    };

    // ========== MANEJAR DATOS JSON DEL NOTES Y ENCARGADOS ==========
    if (notes && typeof notes === 'string') {
  try {
    const notesData = JSON.parse(notes);
    
    // Extraer datos adicionales del notes JSON
    processedData.hospitalName = processedData.hospitalName || notesData.hospital;
    processedData.dependencia = processedData.dependencia || notesData.dependencia;
    processedData.contrato = processedData.contrato || notesData.contrato;
    processedData.equipmentName = processedData.equipmentName || notesData.equipo;
    processedData.equipmentBrand = processedData.equipmentBrand || notesData.marca;
    processedData.equipmentModel = processedData.equipmentModel || notesData.modelo;
    processedData.serialNumber = processedData.serialNumber || notesData.numeroSerie;
    processedData.installationDate = processedData.installationDate || notesData.fechaInstalacion;
    processedData.lastMaintenance = processedData.lastMaintenance || notesData.ultimoMantenimiento;
    processedData.statusApril2025 = processedData.statusApril2025 || notesData.estatusAbril2025;
    processedData.statusStart2026 = processedData.statusStart2026 || notesData.estatusInicio26;
    
    // ========== CORREGIDO: Manejar encargados OPCIONALES ==========
    if (notesData.encargados && Array.isArray(notesData.encargados) && notesData.encargados.length > 0) {
      const encargadosValidos = notesData.encargados.filter(enc => 
        enc.nombre && enc.nombre.trim() !== ''
      );
      
      if (encargadosValidos.length > 0) {
        // Usar el primer encargado como contacto principal
        const encargadoPrincipal = encargadosValidos[0];
        
        processedData.contact = encargadoPrincipal.nombre.trim();
        
        // Si el encargado tiene email, usarlo (si no, mantener el email enviado)
        if (encargadoPrincipal.email && encargadoPrincipal.email.trim() !== '') {
          processedData.email = encargadoPrincipal.email.toLowerCase().trim();
        }
        
        // Si el encargado tiene teléfono, usarlo (si no, mantener el phone enviado)
        if (encargadoPrincipal.telefono && encargadoPrincipal.telefono.trim() !== '') {
          processedData.phone = encargadoPrincipal.telefono.trim();
        }
        
        console.log(`👥 Procesando ${encargadosValidos.length} encargado(s) para cliente ${processedData.name}`);
        console.log(`👤 Encargado principal: ${encargadoPrincipal.nombre} (${encargadoPrincipal.cargo || 'Sin cargo'})`);
      } else {
        console.log(`⚠️ No hay encargados válidos en el JSON. Usando datos básicos del cliente.`);
      }
    } else {
      console.log(`📝 No hay datos de encargados en el JSON. Usando datos básicos del cliente.`);
    }
    
  } catch (jsonError) {
    console.warn('⚠️ Error parsing notes JSON:', jsonError);
  }
} else {
  console.log(`📝 No hay campo notes. Usando solo datos básicos del cliente.`);
}

    console.log('📋 Processed data for database:', processedData);

    // Crear cliente
    const client = await Client.create(processedData);

    console.log('✅ Client created successfully:', client.id);

    res.status(201).json({
      success: true,
      data: client,
      message: 'Cliente creado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Create client error:', error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(err => err.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con esos datos únicos (email, etc.)'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear cliente',
      error: error.message
    });
  }
};

// Actualizar cliente
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar email único (excluyendo el cliente actual)
    if (updateData.email && updateData.email.toLowerCase() !== client.email) {
      const existingClient = await Client.findOne({
        where: { 
          email: updateData.email.toLowerCase(),
          id: { [Op.not]: id }
        }
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con este email'
        });
      }
    }

    // ========== CORREGIR RFC EN ACTUALIZACIÓN ==========
    if (updateData.rfc !== undefined) {
      updateData.rfc = (updateData.rfc && updateData.rfc.trim() && updateData.rfc.trim() !== '') 
        ? updateData.rfc.trim().toUpperCase() 
        : null;
    }

    // Procesar datos JSON del notes si existe
    if (updateData.notes && typeof updateData.notes === 'string') {
      try {
        const notesData = JSON.parse(updateData.notes);
        
        updateData.hospitalName = updateData.hospitalName || notesData.hospital;
        updateData.dependencia = updateData.dependencia || notesData.dependencia;
        updateData.contrato = updateData.contrato || notesData.contrato;
        updateData.equipmentName = updateData.equipmentName || notesData.equipo;
        updateData.equipmentBrand = updateData.equipmentBrand || notesData.marca;
        updateData.equipmentModel = updateData.equipmentModel || notesData.modelo;
        updateData.serialNumber = updateData.serialNumber || notesData.numeroSerie;
        updateData.installationDate = updateData.installationDate || notesData.fechaInstalacion;
        updateData.lastMaintenance = updateData.lastMaintenance || notesData.ultimoMantenimiento;
        updateData.statusApril2025 = updateData.statusApril2025 || notesData.estatusAbril2025;
        updateData.statusStart2026 = updateData.statusStart2026 || notesData.estatusInicio26;
        
        // ========== MANEJAR ENCARGADOS EN ACTUALIZACIÓN ==========
        if (notesData.encargados && Array.isArray(notesData.encargados)) {
          const encargadosValidos = notesData.encargados.filter(enc => 
            enc.nombre && enc.nombre.trim() !== ''
          );
          
          if (encargadosValidos.length > 0) {
            const encargadoPrincipal = encargadosValidos[0];
            
            updateData.contact = encargadoPrincipal.nombre.trim();
            
            if (encargadoPrincipal.email && encargadoPrincipal.email.trim() !== '') {
              updateData.email = encargadoPrincipal.email.toLowerCase().trim();
            }
            
            if (encargadoPrincipal.telefono && encargadoPrincipal.telefono.trim() !== '') {
              updateData.phone = encargadoPrincipal.telefono.trim();
            }
            
            console.log(`👥 Actualizando con ${encargadosValidos.length} encargado(s)`);
          }
        }
        
      } catch (jsonError) {
        console.warn('⚠️ Error parsing notes JSON:', jsonError);
      }
    }

    // Actualizar cliente
    await client.update(updateData);

    res.status(200).json({
      success: true,
      data: client,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Update client error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cliente',
      error: error.message
    });
  }
};

// Eliminar cliente (soft delete)
const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Soft delete
    await client.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cliente',
      error: error.message
    });
  }
};

// Obtener estadísticas de clientes
const getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.count();
    const activeClients = await Client.count({ where: { status: 'active' } });
    const inactiveClients = await Client.count({ where: { status: 'inactive' } });
    
    // Contar por tipo de cliente
    const clientsByType = await Client.findAll({
      attributes: [
        'clientType',
        [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
      ],
      group: ['clientType']
    });

    // Contar por estado
    const clientsByState = await Client.findAll({
      attributes: [
        'state',
        [Client.sequelize.fn('COUNT', Client.sequelize.col('id')), 'count']
      ],
      group: ['state'],
      where: {
        state: { [Op.not]: null }
      },
      limit: 10
    });

    res.status(200).json({
      success: true,
      data: {
        total: totalClients,
        active: activeClients,
        inactive: inactiveClients,
        byType: clientsByType,
        byState: clientsByState
      }
    });
  } catch (error) {
    console.error('Get client stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// ========== NUEVOS MÉTODOS PARA MANEJAR ENCARGADOS ==========

// Obtener encargados de un cliente específico
const getClientEncargados = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findByPk(id, {
      attributes: { exclude: ['deletedAt'] }
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Extraer encargados del campo notes
    let encargados = [];
    try {
      if (client.notes) {
        const notesData = JSON.parse(client.notes);
        encargados = notesData.encargados || [];
      }
    } catch (error) {
      console.warn('Error parsing notes for encargados:', error);
    }
    
    // Si no hay encargados, crear uno basado en los datos principales
    if (encargados.length === 0) {
      encargados = [{
        id: 1,
        nombre: client.contact || 'Encargado Principal',
        cargo: 'Contacto Principal',
        telefono: client.phone || '',
        email: client.email || '',
        fechaRegistro: client.createdAt || new Date().toISOString()
      }];
    }
    
    res.status(200).json({
      success: true,
      data: encargados
    });
  } catch (error) {
    console.error('Get client encargados error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener encargados',
      error: error.message
    });
  }
};

// Agregar encargado a un cliente existente
const addEncargadoToClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cargo, telefono, email } = req.body;
    
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del encargado es requerido'
      });
    }
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    // Obtener encargados actuales
    let notesData = {};
    let encargados = [];
    
    try {
      if (client.notes) {
        notesData = JSON.parse(client.notes);
        encargados = notesData.encargados || [];
      }
    } catch (error) {
      console.warn('Error parsing existing notes:', error);
    }
    
    // Crear nuevo encargado
    const newEncargado = {
      id: Date.now(),
      nombre: nombre.trim(),
      cargo: cargo?.trim() || '',
      telefono: telefono?.trim() || '',
      email: email?.trim() || '',
      fechaRegistro: new Date().toISOString()
    };
    
    // Agregar a la lista
    encargados.push(newEncargado);
    
    // Actualizar notes
    notesData.encargados = encargados;
    
    // Si es el primer encargado, actualizar campos principales
    if (encargados.length === 1) {
      await client.update({
        contact: newEncargado.nombre,
        email: newEncargado.email || client.email,
        phone: newEncargado.telefono || client.phone,
        notes: JSON.stringify(notesData)
      });
    } else {
      await client.update({
        notes: JSON.stringify(notesData)
      });
    }
    
    res.status(201).json({
      success: true,
      data: newEncargado,
      message: 'Encargado agregado exitosamente'
    });
    
  } catch (error) {
    console.error('Add encargado error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar encargado',
      error: error.message
    });
  }
};

// Actualizar encargado específico
const updateClientEncargado = async (req, res) => {
  try {
    const { id, encargadoId } = req.params;
    const { nombre, cargo, telefono, email } = req.body;
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    let notesData = {};
    let encargados = [];
    
    try {
      if (client.notes) {
        notesData = JSON.parse(client.notes);
        encargados = notesData.encargados || [];
      }
    } catch (error) {
      console.warn('Error parsing existing notes:', error);
    }
    
    // Buscar y actualizar encargado
    const encargadoIndex = encargados.findIndex(enc => enc.id == encargadoId);
    
    if (encargadoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Encargado no encontrado'
      });
    }
    
    // Actualizar encargado
    encargados[encargadoIndex] = {
      ...encargados[encargadoIndex],
      nombre: nombre?.trim() || encargados[encargadoIndex].nombre,
      cargo: cargo?.trim() || '',
      telefono: telefono?.trim() || '',
      email: email?.trim() || ''
    };
    
    // Actualizar notes
    notesData.encargados = encargados;
    
    // Si es el encargado principal (index 0), actualizar campos principales
    if (encargadoIndex === 0) {
      await client.update({
        contact: encargados[0].nombre,
        email: encargados[0].email || client.email,
        phone: encargados[0].telefono || client.phone,
        notes: JSON.stringify(notesData)
      });
    } else {
      await client.update({
        notes: JSON.stringify(notesData)
      });
    }
    
    res.status(200).json({
      success: true,
      data: encargados[encargadoIndex],
      message: 'Encargado actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Update encargado error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar encargado',
      error: error.message
    });
  }
};

// Eliminar encargado específico
const removeEncargadoFromClient = async (req, res) => {
  try {
    const { id, encargadoId } = req.params;
    
    const client = await Client.findByPk(id);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    let notesData = {};
    let encargados = [];
    
    try {
      if (client.notes) {
        notesData = JSON.parse(client.notes);
        encargados = notesData.encargados || [];
      }
    } catch (error) {
      console.warn('Error parsing existing notes:', error);
    }
    
    // Verificar que no sea el último encargado
    if (encargados.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el último encargado. Debe haber al menos uno.'
      });
    }
    
    // Buscar índice del encargado a eliminar
    const encargadoIndex = encargados.findIndex(enc => enc.id == encargadoId);
    
    if (encargadoIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Encargado no encontrado'
      });
    }
    
    // Eliminar encargado
    const encargadoEliminado = encargados.splice(encargadoIndex, 1)[0];
    
    // Actualizar notes
    notesData.encargados = encargados;
    
    // Si eliminamos el encargado principal (index 0), promover el siguiente
    if (encargadoIndex === 0 && encargados.length > 0) {
      await client.update({
        contact: encargados[0].nombre,
        email: encargados[0].email || client.email,
        phone: encargados[0].telefono || client.phone,
        notes: JSON.stringify(notesData)
      });
    } else {
      await client.update({
        notes: JSON.stringify(notesData)
      });
    }
    
    res.status(200).json({
      success: true,
      data: encargadoEliminado,
      message: 'Encargado eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Remove encargado error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar encargado',
      error: error.message
    });
  }
};

// ========== EXPORTACIONES ==========
module.exports = {
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  // ========== NUEVOS MÉTODOS DE ENCARGADOS ==========
  getClientEncargados,
  addEncargadoToClient,
  updateClientEncargado,
  removeEncargadoFromClient
};
// scripts/importProductsFromExcel.js - Script para importar productos desde Excel
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Product, Category, User } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

// Mapeo de headers del Excel a campos de la base de datos
const FIELD_MAPPING = {
  'SERVICIO': 'servicio',
  'ESPECIALIDAD': 'especialidad', 
  'CLASIFICACION': 'clasificacion',
  'PARA': 'para_descripcion',
  'DESCRIPCION': 'para_descripcion', // Backup si PARA está vacío
  'ITEM': 'item',
  'CANTIDAD PAQUETE': 'cantidad_paquete',
  'MONEDA': 'moneda',
  'COSTO': 'costo',
  'COSTO U ': 'costo_unitario',
  'CADUCIDAD ALMACEN': 'almacen', // Asumo que se refiere a ubicación
  'PROVEEDOR': 'proveedor',
  'USO': 'uso',
  'ALMACEN EN:': 'almacen_en',
  'INCLUYE IIMPUESTOS': 'incluye',
  'FACTORY PRICE': 'factory_price',
  'LANDED FACTOR ': 'landed_factor',
  'MARGIN FACTOR': 'margin_factor',
  'VALOR MONEDA': 'valor_moneda',
  'COMISION VENTA': 'comision_venta',
  'PRECIO VENTA PAQUETE': 'precio_venta_paquete',
  'PRECIO UNITARIO': 'precio_unitario'
};

// Función para limpiar y convertir valores
const cleanValue = (value, fieldType = 'string') => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (fieldType) {
    case 'number':
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    case 'integer':
      const int = parseInt(value);
      return isNaN(int) ? null : int;
    case 'string':
      return String(value).trim();
    case 'currency':
      // Convertir MX a MXN
      if (value === 'MX') return 'MXN';
      return String(value).trim();
    default:
      return value;
  }
};

// Función para generar código único si no existe
const generateProductCode = (item, index) => {
  if (item && typeof item === 'string' && item.trim()) {
    return item.trim().toUpperCase();
  }
  // Si no hay código, generar uno
  return `PROD-${String(index).padStart(4, '0')}`;
};

// Función para mapear categoría basada en especialidad/servicio
const getCategoryId = async (especialidad, servicio, clasificacion) => {
  const categories = await Category.findAll();
  const categoryMap = {};
  
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Lógica de asignación de categorías
  if (especialidad === 'ELECTRODO') {
    return categoryMap['ELECTRODO'];
  } else if (especialidad === 'TEMPERATURA' || clasificacion?.includes('TEMPERATURA')) {
    return categoryMap['SENSOR'];
  } else if (especialidad === 'BP' || clasificacion === 'BRAZALETE BP') {
    return categoryMap['BRAZALETE BP'];
  } else if (clasificacion === 'PARCHES') {
    return categoryMap['PARCHES'];
  } else if (servicio === 'ACCESORIO') {
    return categoryMap['ACCESORIO'];
  }
  
  // Por defecto, asignar a ACCESORIO
  return categoryMap['ACCESORIO'];
};

const importProductsFromExcel = async (excelFilePath) => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    // Verificar que existe un usuario para createdBy
    let adminUser = await User.findOne({ where: { role: 'admin' } });
    if (!adminUser) {
      console.log('👤 Creando usuario admin temporal...');
      adminUser = await User.create({
        username: 'admin',
        email: 'admin@cotizador.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'Sistema',
        phone: '+529611234567',
        role: 'admin',
        position: 'Administrador'
      });
    }

    console.log('📁 Leyendo archivo Excel...');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Archivo no encontrado: ${excelFilePath}`);
    }

    // Leer el archivo Excel
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Tomar la primera hoja
    const worksheet = workbook.Sheets[sheetName];

    console.log(`📊 Procesando hoja: ${sheetName}`);

    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('El archivo Excel debe tener al menos 2 filas (headers + datos)');
    }

    const headers = jsonData[0];
    const dataRows = jsonData.slice(1);

    console.log(`📝 Headers encontrados: ${headers.length}`);
    console.log(`📊 Filas de datos: ${dataRows.length}`);

    // Mapear índices de columnas
    const columnIndexes = {};
    headers.forEach((header, index) => {
      if (FIELD_MAPPING[header]) {
        columnIndexes[FIELD_MAPPING[header]] = index;
      }
    });

    console.log('🗂️  Mapeo de columnas:');
    Object.entries(columnIndexes).forEach(([field, index]) => {
      console.log(`   ${field} -> Columna ${index + 1} (${headers[index]})`);
    });

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log('\n🔄 Procesando productos...');

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = dataRows[i];
        
        // Saltar filas vacías
        if (!row || row.every(cell => !cell)) {
          console.log(`⏭️  Saltando fila vacía ${i + 2}`);
          continue;
        }

        // Extraer datos de la fila
        const productData = {
          // Campos requeridos
          code: generateProductCode(row[columnIndexes['item']], i + 1),
          createdBy: adminUser.id,
          
          // Campos del negocio
          servicio: cleanValue(row[columnIndexes['servicio']], 'string'),
          especialidad: cleanValue(row[columnIndexes['especialidad']], 'string'),
          clasificacion: cleanValue(row[columnIndexes['clasificacion']], 'string'),
          para_descripcion: cleanValue(row[columnIndexes['para_descripcion']], 'string'),
          item: cleanValue(row[columnIndexes['item']], 'string'),
          cantidad_paquete: cleanValue(row[columnIndexes['cantidad_paquete']], 'integer') || 1,
          moneda: cleanValue(row[columnIndexes['moneda']], 'currency') || 'MXN',
          costo: cleanValue(row[columnIndexes['costo']], 'number'),
          costo_unitario: cleanValue(row[columnIndexes['costo_unitario']], 'number'),
          almacen: cleanValue(row[columnIndexes['almacen']], 'string'),
          proveedor: cleanValue(row[columnIndexes['proveedor']], 'string'),
          uso: cleanValue(row[columnIndexes['uso']], 'string'),
          almacen_en: cleanValue(row[columnIndexes['almacen_en']], 'string'),
          incluye: cleanValue(row[columnIndexes['incluye']], 'string'),
          factory_price: cleanValue(row[columnIndexes['factory_price']], 'number'),
          landed_factor: cleanValue(row[columnIndexes['landed_factor']], 'number') || 1.0,
          margin_factor: cleanValue(row[columnIndexes['margin_factor']], 'number') || 1.0,
          valor_moneda: cleanValue(row[columnIndexes['valor_moneda']], 'number') || 1.0,
          comision_venta: cleanValue(row[columnIndexes['comision_venta']], 'number') || 0.0,
          precio_venta_paquete: cleanValue(row[columnIndexes['precio_venta_paquete']], 'number'),
          precio_unitario: cleanValue(row[columnIndexes['precio_unitario']], 'number')
        };

        // Asignar categoría
        productData.categoryId = await getCategoryId(
          productData.especialidad,
          productData.servicio,
          productData.clasificacion
        );

        // Verificar que el código no exista
        const existingProduct = await Product.findOne({
          where: { code: productData.code }
        });

        if (existingProduct) {
          console.log(`⚠️  Producto ya existe: ${productData.code} - Actualizando...`);
          await existingProduct.update(productData);
        } else {
          await Product.create(productData);
        }

        successCount++;
        console.log(`✅ ${successCount}. ${productData.code} - ${productData.item || 'Sin nombre'}`);

      } catch (error) {
        errorCount++;
        const errorMsg = `Fila ${i + 2}: ${error.message}`;
        errors.push(errorMsg);
        console.log(`❌ ${errorMsg}`);
      }
    }

    console.log('\n🎉 Importación completada:');
    console.log(`   ✅ Productos procesados exitosamente: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n🚨 Errores encontrados:');
      errors.forEach(error => console.log(`   ${error}`));
    }

    // Mostrar estadísticas finales
    const totalProducts = await Product.count();
    console.log(`\n📊 Total de productos en la base de datos: ${totalProducts}`);

    // Actualizar contadores de categorías
    const categories = await Category.findAll();
    for (const category of categories) {
      const productCount = await Product.count({ where: { categoryId: category.id } });
      await category.update({ productCount });
      console.log(`📁 ${category.name}: ${productCount} productos`);
    }

    return {
      success: true,
      totalProcessed: dataRows.length,
      successCount,
      errorCount,
      errors
    };

  } catch (error) {
    console.error('❌ Error en la importación:', error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  const excelPath = process.argv[2] || path.join(__dirname, '..', 'Precios.xlsx');
  
  console.log(`📁 Archivo Excel: ${excelPath}`);
  
  importProductsFromExcel(excelPath)
    .then((result) => {
      console.log('✅ Importación completada exitosamente');
      console.log('📊 Resultados:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la importación:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize.close();
    });
}

module.exports = { importProductsFromExcel };
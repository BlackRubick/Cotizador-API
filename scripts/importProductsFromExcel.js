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
  'PRICE EXW': 'factory_price',
  'LANDED FACTOR ': 'landed_factor',
  'MARGIN FACTOR': 'margin_factor',
  'VALOR MONEDA': 'valor_moneda',
  'COMISION VENTA': 'comision_venta',
  'PRECIO VENTA PAQUETE': 'precio_venta_paquete',
  'PRECIO VENTA': 'precio_venta_paquete',
  'PRECIO UNITARIO': 'precio_unitario'
};

// Función para limpiar y convertir valores
const cleanValue = (value, fieldType = 'string') => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (fieldType) {
    case 'number':
      // Aceptar formatos con símbolos de moneda, comas de miles y espacios
      try {
        let v = value;
        if (typeof v !== 'string') v = String(v);
        // Eliminar caracteres no numéricos excepto punto y signo negativo
        const cleaned = v.replace(/[^0-9.\-]+/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      } catch (e) {
        return null;
      }
    case 'integer':
      try {
        let v = value;
        if (typeof v !== 'string') v = String(v);
        const cleaned = v.replace(/[^0-9\-]+/g, '');
        const int = parseInt(cleaned);
        return isNaN(int) ? null : int;
      } catch (e) {
        return null;
      }
    case 'string':
      return String(value).trim();
    case 'currency':
      // Normalizar códigos de moneda y variantes comunes
      try {
        let v = String(value).trim();
        if (!v) return null;
        const up = v.toUpperCase();
        const currencyMap = {
          'MX': 'MXN',
          'MXN': 'MXN',
          'US': 'USD',
          'USD': 'USD',
          'EU': 'EUR',
          'EUR': 'EUR',
          '$': 'USD'
        };
        if (currencyMap[up]) return currencyMap[up];
        // Devolver primer token (por si viene como 'MXN ' o ' USD')
        return up.split('\\s+')[0];
      } catch (e) {
        return null;
      }
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
      // Mapear índices de columnas (normalizando headers para evitar espacios o diferencias de mayúsculas)
      const columnIndexes = {};
      // Normalizar el mapping: claves en mayúsculas y sin espacios al inicio/fin
      const normalizedMapping = {};
      Object.entries(FIELD_MAPPING).forEach(([k, v]) => {
        if (typeof k === 'string') {
          normalizedMapping[k.trim().toUpperCase()] = v;
        }
      });

      headers.forEach((header, index) => {
        const raw = header === undefined || header === null ? '' : String(header);
        const key = raw.trim().toUpperCase();
        if (normalizedMapping[key]) {
          columnIndexes[normalizedMapping[key]] = index;
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
        // Construir productData sólo con los campos que realmente existen en el archivo
        const productData = {};
        // Campos requeridos
        productData.code = generateProductCode(row[columnIndexes['item']], i + 1);
        productData.createdBy = adminUser.id;

        // Helper para asignar solo si la columna existe
        const assignIfExists = (key, type = 'string', defaultValue) => {
          if (columnIndexes[key] !== undefined) {
            const val = cleanValue(row[columnIndexes[key]], type);
            productData[key] = (val === null || val === undefined) ? defaultValue : val;
          }
        };

        assignIfExists('servicio', 'string');
        assignIfExists('especialidad', 'string');
        assignIfExists('clasificacion', 'string');
        assignIfExists('para_descripcion', 'string');
        assignIfExists('item', 'string');
        assignIfExists('cantidad_paquete', 'integer', 1);
        assignIfExists('moneda', 'currency', 'MXN');
        assignIfExists('costo', 'number');
        assignIfExists('costo_unitario', 'number');
        assignIfExists('almacen', 'string');
        assignIfExists('proveedor', 'string');
        assignIfExists('uso', 'string');
        assignIfExists('almacen_en', 'string');
        assignIfExists('incluye', 'string');
        assignIfExists('factory_price', 'number');
        assignIfExists('landed_factor', 'number', 1.0);
        assignIfExists('margin_factor', 'number', 1.0);
        assignIfExists('valor_moneda', 'number', 1.0);
        assignIfExists('comision_venta', 'number', 0.0);
        // Preferir PRECIO VENTA (mapeado a precio_venta_paquete)
        assignIfExists('precio_venta_paquete', 'number');
        assignIfExists('precio_unitario', 'number');

        // Si no hay PRECIO VENTA directo, intentar calcularlo desde factory_price y factores
        const hasPrecioVenta = Object.prototype.hasOwnProperty.call(productData, 'precio_venta_paquete') && productData.precio_venta_paquete !== null && productData.precio_venta_paquete !== undefined;
        if (!hasPrecioVenta) {
          const fp = productData.factory_price || null;
          const lf = productData.landed_factor || productData.landen_factor || 1.0;
          const mf = productData.margin_factor || 1.0;
          const vm = productData.valor_moneda || 1.0;
          const com = productData.comision_venta || 0.0;

          if (fp !== null && fp !== undefined) {
            // precio = factory_price * landed_factor * margin_factor * valor_moneda * (1 + comisionVenta/100)
            const computed = Number(fp) * Number(lf || 1) * Number(mf || 1) * Number(vm || 1) * (1 + (Number(com) / 100 || 0));
            if (!isNaN(computed)) {
              productData.precio_venta_paquete = parseFloat(computed.toFixed(2));
              console.log(`ℹ️ Calculated precio_venta_paquete from factory_price for ${productData.code}: ${productData.precio_venta_paquete}`);
            }
          }
        }

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
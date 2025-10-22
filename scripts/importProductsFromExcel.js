// scripts/importProductsFromExcel.js - Script para importar productos desde Excel
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Product, Category, User } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

const FIELD_MAPPING = {
  'SERVICIO': 'servicio',
  'ESPECIALIDAD': 'especialidad',
  'CLASIFICACION': 'clasificacion',
  'PARA': 'para_descripcion',
  'DESCRIPCION': 'para_descripcion',
  'ITEM': 'item',
  'CANTIDAD PAQUETE': 'cantidad_paquete',
  'MONEDA': 'moneda',
  'COSTO': 'costo',
  'COSTO U': 'costo_unitario',
  'COSTO U ': 'costo_unitario',
  'CADUCIDAD ALMACEN': 'almacen',
  'PROVEEDOR': 'proveedor',
  'USO': 'uso',
  'ALMACEN EN': 'almacen_en',
  'ALMACEN EN:': 'almacen_en',
  'INCLUYE IIMPUESTOS': 'incluye',
  'FACTORY PRICE': 'factory_price',
  'PRICE EXW': 'factory_price',
  'LANDED FACTOR': 'landed_factor',
  'LANDED FACTOR ': 'landed_factor',
  'MARGIN FACTOR': 'margin_factor',
  'VALOR MONEDA': 'valor_moneda',
  'COMISION VENTA': 'comision_venta',
  'PRECIO VENTA PAQUETE': 'precio_venta_paquete',
  'PRECIO VENTA': 'precio_venta_paquete',
  'PRECIO UNITARIO': 'precio_unitario'
};

const cleanValue = (value, fieldType = 'string') => {
  if (value === null || value === undefined || value === '') return null;
  switch (fieldType) {
    case 'number': {
      try {
        let v = value; if (typeof v !== 'string') v = String(v);
        const cleaned = v.replace(/[^0-9.\-]+/g, '');
        const num = parseFloat(cleaned); return isNaN(num) ? null : num;
      } catch { return null; }
    }
    case 'integer': {
      try { let v = value; if (typeof v !== 'string') v = String(v);
        const cleaned = v.replace(/[^0-9\-]+/g, ''); const int = parseInt(cleaned); return isNaN(int) ? null : int; } catch { return null; }
    }
    case 'string': return String(value).trim();
    case 'currency': {
      try { let v = String(value).trim(); if (!v) return null; const up = v.toUpperCase();
        const currencyMap = { 'MX': 'MXN','MXN':'MXN','US':'USD','USD':'USD','EU':'EUR','EUR':'EUR','$':'USD' };
        if (currencyMap[up]) return currencyMap[up]; return up.split(/\s+/)[0]; } catch { return null; }
    }
    default: return value;
  }
};

const generateProductCode = (item, index) => { if (item && typeof item === 'string' && item.trim()) return item.trim().toUpperCase(); return `PROD-${String(index).padStart(4,'0')}`; };

const getCategoryId = async (especialidad, servicio, clasificacion) => {
  const categories = await Category.findAll(); const categoryMap = {}; categories.forEach(c => { categoryMap[c.name] = c.id; });
  if (especialidad === 'ELECTRODO') return categoryMap['ELECTRODO'];
  if (especialidad === 'TEMPERATURA' || clasificacion?.includes('TEMPERATURA')) return categoryMap['SENSOR'];
  if (especialidad === 'BP' || clasificacion === 'BRAZALETE BP') return categoryMap['BRAZALETE BP'];
  if (clasificacion === 'PARCHES') return categoryMap['PARCHES'];
  if (servicio === 'ACCESORIO') return categoryMap['ACCESORIO'];
  return categoryMap['ACCESORIO'];
};

const importProductsFromExcel = async (excelFilePath, options = { dryRun: false }) => {
  try {
    if (!options.dryRun) {
      await sequelize.authenticate();
      let adminUser = await User.findOne({ where: { role: 'admin' } });
      if (!adminUser) adminUser = await User.create({ username: 'admin', email: 'admin@cotizador.com', password: 'admin123', firstName: 'Admin', lastName: 'Sistema', phone: '+529611234567', role: 'admin', position: 'Administrador' });
      options.adminUser = adminUser;
    } else options.adminUser = { id: 'DRY-RUN' };

    const adminUser = options.adminUser;
    if (!fs.existsSync(excelFilePath)) throw new Error(`Archivo no encontrado: ${excelFilePath}`);
    const workbook = XLSX.readFile(excelFilePath); const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); if (jsonData.length < 2) throw new Error('El archivo Excel debe tener al menos 2 filas (headers + datos)');
    const headers = jsonData[0]; const dataRows = jsonData.slice(1);

    const columnIndexes = {}; const normalizedMapping = {};
    Object.entries(FIELD_MAPPING).forEach(([k,v]) => { if (typeof k === 'string') normalizedMapping[k.trim().toUpperCase()] = v; });
    // Match headers robustly: exact match first, then substring/simplified fallback
    headers.forEach((h, idx) => {
      const raw = h === undefined || h === null ? '' : String(h);
      const key = raw.trim().toUpperCase();
      if (normalizedMapping[key]) {
        columnIndexes[normalizedMapping[key]] = idx;
        return;
      }

      // Try substring match (handles 'PRECIO VENTA $', 'PRECIO VENTA (MXN)', etc.)
      let matched = false;
      for (const mapKey of Object.keys(normalizedMapping)) {
        if (!mapKey) continue;
        if (key.includes(mapKey) || mapKey.includes(key)) {
          columnIndexes[normalizedMapping[mapKey]] = idx;
          matched = true;
          break;
        }
      }

      if (matched) return;

      // Simplified comparison: strip non-alphanumeric and try again
      const simplified = key.replace(/[^A-Z0-9 ]+/g, '').trim();
      for (const mapKey of Object.keys(normalizedMapping)) {
        const sm = mapKey.replace(/[^A-Z0-9 ]+/g, '').trim();
        if (!sm) continue;
        if (simplified.includes(sm) || sm.includes(simplified)) {
          columnIndexes[normalizedMapping[mapKey]] = idx;
          break;
        }
      }
    });

    const dryRunResults = []; let successCount = 0, errorCount = 0; const errors = [];
    for (let i=0;i<dataRows.length;i++) {
      try {
        const row = dataRows[i]; if (!row || row.every(c => !c)) continue;
        const productData = {};
  // Support multiple possible code/item headers
  const codeColumnIndex = columnIndexes['item'] ?? columnIndexes['code'] ?? columnIndexes['codigo'] ?? columnIndexes['cod'] ?? columnIndexes['item_code'];
  productData.code = generateProductCode(row[codeColumnIndex], i+1);
        productData.createdBy = adminUser.id;
  const assignIfExists = (key,type='string',def)=>{ if (columnIndexes[key] !== undefined) { const v = cleanValue(row[columnIndexes[key]], type); productData[key] = (v===null||v===undefined)?def:v; } };
        assignIfExists('servicio','string'); assignIfExists('especialidad','string'); assignIfExists('clasificacion','string'); assignIfExists('para_descripcion','string'); assignIfExists('item','string');
        assignIfExists('cantidad_paquete','integer',1); assignIfExists('moneda','currency','MXN'); assignIfExists('costo','number'); assignIfExists('costo_unitario','number'); assignIfExists('almacen','string'); assignIfExists('proveedor','string');
        assignIfExists('uso','string'); assignIfExists('almacen_en','string'); assignIfExists('incluye','string'); assignIfExists('factory_price','number'); assignIfExists('landed_factor','number',1.0); assignIfExists('margin_factor','number',1.0);
        assignIfExists('valor_moneda','number',1.0); assignIfExists('comision_venta','number',0.0); assignIfExists('precio_venta_paquete','number'); assignIfExists('precio_unitario','number');

        const hasPrecioVenta = Object.prototype.hasOwnProperty.call(productData,'precio_venta_paquete') && productData.precio_venta_paquete!=null;
        if (!hasPrecioVenta && productData.factory_price!=null) {
          const fp = Number(productData.factory_price); const lf = Number(productData.landed_factor||1); const mf = Number(productData.margin_factor||1); const vm = Number(productData.valor_moneda||1); const com = Number(productData.comision_venta||0);
          const computed = fp * lf * mf * vm * (1 + (com/100));
          if (!isNaN(computed)) productData.precio_venta_paquete = parseFloat(computed.toFixed(2));
        }

        if (!options.dryRun) {
          const existing = await Product.findOne({ where: { code: productData.code } });
          if (existing) await existing.update(productData); else await Product.create(productData);
          successCount++;
        } else {
          dryRunResults.push({ row: i+2, code: productData.code, item: productData.item, factory_price: productData.factory_price, precio_venta_paquete: productData.precio_venta_paquete });
        }
      } catch (e) { errorCount++; errors.push(`Fila ${i+2}: ${e.message}`); }
    }

    if (options.dryRun) return { success:true, totalProcessed: dataRows.length, successCount, errorCount, errors, dryRunResults };

    const totalProducts = await Product.count();
    const categories = await Category.findAll();
    for (const c of categories) { const productCount = await Product.count({ where: { categoryId: c.id } }); await c.update({ productCount }); }
    return { success:true, totalProcessed: dataRows.length, successCount, errorCount, errors };
  } catch (error) { console.error('Error import:', error); throw error; }
};

if (require.main === module) {
  const excelPath = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', 'Precios.xlsx');
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  console.log(`Archivo: ${excelPath}  dryRun: ${dryRun}`);
  importProductsFromExcel(excelPath,{ dryRun }).then(r=>{ console.log('Done', r); process.exit(0); }).catch(e=>{ console.error(e); process.exit(1); }).finally(()=>{ if (!dryRun) sequelize.close(); });
}

module.exports = { importProductsFromExcel };
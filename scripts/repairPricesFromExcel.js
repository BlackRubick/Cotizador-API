// scripts/repairPricesFromExcel.js
// Safe updater: set precio_venta_paquete on products using the Excel column 'PRECIO VENTA'
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Product } = require('../models');
const sequelize = require('../config/database');
require('dotenv').config();

const cleanNumber = (v) => {
  if (v === null || v === undefined || v === '') return null;
  try {
    let s = String(v).trim();
    // replace comma as thousand separator, allow decimal point
    s = s.replace(/\s+/g, '');
    // normalize comma decimal (e.g. 1.234,56) -> 1234.56
    if (/[0-9]+\.[0-9]{3},[0-9]+$/.test(s)) {
      s = s.replace(/\./g, '').replace(/,/, '.');
    }
    // remove currency symbols and any non numeric except dot and minus
    s = s.replace(/[^0-9.\-]+/g, '');
    const n = parseFloat(s);
    return Number.isNaN(n) ? null : n;
  } catch (e) {
    return null;
  }
};

const findColumnIndexes = (headers) => {
  const map = {};
  const normalize = (h) => (h === undefined || h === null ? '' : String(h).trim().toUpperCase());
  const normalized = headers.map(normalize);

  // possible names
  const codeKeys = ['ITEM', 'CODE', 'CODIGO', 'COD', 'ITEM CODE', 'ITEM_CODE'];
  const precioKeys = ['PRECIO VENTA PAQUETE', 'PRECIO VENTA', 'PRECIO VTA', 'PRECIO'];

  for (let i = 0; i < normalized.length; i++) {
    const h = normalized[i];
    if (!map.code) {
      for (const k of codeKeys) if (h === k || h.includes(k)) map.code = i;
    }
    if (!map.precio) {
      for (const k of precioKeys) if (h === k || h.includes(k)) map.precio = i;
    }
  }
  return map;
};

const repair = async (excelPath, options = { dryRun: true, confirm: false, backup: true }) => {
  if (!fs.existsSync(excelPath)) throw new Error(`Archivo no encontrado: ${excelPath}`);
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rows.length < 2) throw new Error('El archivo Excel debe tener al menos 2 filas (headers + datos)');
  const headers = rows[0];
  const dataRows = rows.slice(1);
  const idx = findColumnIndexes(headers);
  if (idx.code === undefined && !options.useGeneratedCodes) throw new Error('No se pudo detectar la columna de código/ITEM en el Excel. Si quieres usar códigos generados (PROD-0001...), ejecuta con --use-generated-codes');
  if (idx.precio === undefined) throw new Error('No se pudo detectar la columna PRECIO VENTA en el Excel');

  const generateProductCode = (item, index) => { if (item && typeof item === 'string' && item.trim()) return item.trim().toUpperCase(); return `PROD-${String(index).padStart(4,'0')}`; };

  const changes = [];
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    let code = null;
    if (idx.code !== undefined) {
      const codeRaw = row[idx.code];
      code = codeRaw ? String(codeRaw).trim().toUpperCase() : null;
    } else if (options.useGeneratedCodes) {
      // i is zero-based for dataRows; earlier import used (i+1) to generate PROD-0001 for first data row
      code = generateProductCode(null, i+1);
    }
    const rawPrecio = row[idx.precio];
    const precio = cleanNumber(rawPrecio);
    if (!code) continue;
    if (precio === null) continue; // nothing to update from excel
    changes.push({ row: i + 2, code, precio });
  }

  if (changes.length === 0) return { success: true, message: 'No hay filas con precio válido en Excel para aplicar.' };

  // dry-run: list proposed changes and write to file
  const summary = { totalRows: dataRows.length, proposedUpdates: changes.length };
  const outDir = path.join(process.cwd(), 'data', 'repairs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dryFile = path.join(outDir, `repair-dryrun-${ts}.json`);
  fs.writeFileSync(dryFile, JSON.stringify({ summary, changes }, null, 2), 'utf8');

  if (options.dryRun || !options.confirm) {
    return { success: true, dryRun: true, summary, changesFile: dryFile };
  }

  // confirm: apply updates
  await sequelize.authenticate();
  const backupFile = path.join(outDir, `repair-backup-before-${ts}.json`);
  if (options.backup) {
    const productIds = changes.map(c => c.code);
    const products = await Product.findAll({ where: { code: productIds } });
    const backup = products.map(p => ({ id: p.id, code: p.code, precio_venta_paquete: p.precio_venta_paquete }));
    fs.writeFileSync(backupFile, JSON.stringify({ updatedAt: new Date().toISOString(), backup }, null, 2), 'utf8');
  }

  const applied = [];
  for (const c of changes) {
    const prod = await Product.findOne({ where: { code: c.code } });
    if (!prod) {
      applied.push({ code: c.code, status: 'not-found' });
      continue;
    }
    const previous = prod.precio_venta_paquete;
    prod.precio_venta_paquete = c.precio;
    await prod.save();
    applied.push({ code: c.code, status: 'updated', previous, now: c.precio });
  }

  const appliedFile = path.join(outDir, `repair-applied-${ts}.json`);
  fs.writeFileSync(appliedFile, JSON.stringify({ applied }, null, 2), 'utf8');
  return { success: true, dryRun: false, summary, appliedCount: applied.filter(a=>a.status==='updated').length, appliedFile, backupFile };
};

if (require.main === module) {
  const excelPath = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(__dirname, '..', 'data', 'Precios.xlsx');
  const dry = process.argv.includes('--dry-run') || process.argv.includes('-n');
  const confirm = process.argv.includes('--confirm');
  const backup = !process.argv.includes('--no-backup');
  console.log('Archivo:', excelPath, 'dryRun:', dry, 'confirm:', confirm, 'backup:', backup);
  repair(excelPath, { dryRun: dry, confirm, backup }).then(r => { console.log('Done', r); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
}

module.exports = { repair };

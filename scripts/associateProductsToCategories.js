// scripts/associateProductsToCategories.js
const { Product, Category } = require('../models');
const sequelize = require('../config/database');

const associateProductsToCategories = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conectado a MySQL');

    // Obtener todas las categorías
    const categories = await Category.findAll();
    console.log('📁 Categorías disponibles:');
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
      console.log(`   ${cat.id}: ${cat.name}`);
    });

    // Obtener todos los productos sin categoría
    const products = await Product.findAll({ 
      where: { categoryId: null },
      attributes: ['id', 'code', 'item', 'servicio', 'especialidad', 'clasificacion', 'para_descripcion']
    });
    
    console.log(`\n📦 Productos a procesar: ${products.length}`);

    let updatedCount = 0;

    for (const product of products) {
      let categoryId = null;
      let reason = '';

      // Lógica de asignación basada en especialidad y características del producto
      if (product.especialidad === 'ELECTRODO') {
        categoryId = categoryMap['ELECTRODO'];
        reason = 'especialidad = ELECTRODO';
      } 
      else if (product.especialidad === 'TEMPERATURA' || product.code.includes('T004')) {
        categoryId = categoryMap['PARCHES'];
        reason = 'temperatura/parches';
      } 
      else if (product.especialidad === 'BP' || product.clasificacion === 'BRAZALETE BP') {
        categoryId = categoryMap['BRAZALETE BP'];
        reason = 'presión arterial';
      }
      else if (product.code.includes('NN') && product.especialidad === 'BP') {
        categoryId = categoryMap['BRAZALETE BP'];
        reason = 'brazalete neonatal';
      }
      // Sensores diversos
      else if (product.para_descripcion && product.para_descripcion.toLowerCase().includes('sensor')) {
        categoryId = categoryMap['SENSOR'];
        reason = 'contiene "sensor" en descripción';
      }
      // Circuitos de paciente
      else if (product.item && product.item.toLowerCase().includes('circuito')) {
        categoryId = categoryMap['CIRCUITO PACIENTE'];
        reason = 'contiene "circuito"';
      }
      // Sondas
      else if (product.item && product.item.toLowerCase().includes('sonda')) {
        categoryId = categoryMap['SONDA'];
        reason = 'contiene "sonda"';
      }
      // Cables y componentes de interconexión
      else if (product.item && (
        product.item.toLowerCase().includes('cable') || 
        product.item.toLowerCase().includes('conector') ||
        product.item.toLowerCase().includes('adaptador')
      )) {
        categoryId = categoryMap['Componentes de interconexión'];
        reason = 'componente de interconexión';
      }
      // Accesorios por defecto
      else if (product.servicio === 'ACCESORIO') {
        categoryId = categoryMap['ACCESORIO'];
        reason = 'servicio = ACCESORIO';
      }
      // Consumibles que no encajan en otras categorías
      else if (product.servicio === 'CONSUMIBLES') {
        // Decidir basado en el código o descripción
        if (product.code.includes('MSG')) {
          categoryId = categoryMap['ELECTRODO'];
          reason = 'consumible - código MSG (electrodo)';
        } else {
          categoryId = categoryMap['ACCESORIO'];
          reason = 'consumible - genérico';
        }
      }
      // Por defecto, accesorios
      else {
        categoryId = categoryMap['ACCESORIO'];
        reason = 'categoría por defecto';
      }

      if (categoryId) {
        await product.update({ categoryId });
        updatedCount++;

        const categoryName = categories.find(c => c.id === categoryId)?.name || 'DESCONOCIDA';
        console.log(`✅ ${product.code.padEnd(12)} → ${categoryName.padEnd(25)} (${reason})`);
      } else {
        console.log(`❌ ${product.code.padEnd(12)} → SIN CATEGORÍA ASIGNADA`);
      }
    }

    console.log(`\n🎉 Proceso completado: ${updatedCount} productos actualizados`);

    // Verificación final - mostrar resumen por categoría
    console.log('\n📊 Resumen por categoría:');
    for (const category of categories) {
      const count = await Product.count({ where: { categoryId: category.id } });
      console.log(`   ${category.name.padEnd(30)}: ${count} productos`);
    }

    // Mostrar productos sin categoría (si los hay)
    const unassigned = await Product.count({ where: { categoryId: null } });
    if (unassigned > 0) {
      console.log(`   ${'SIN CATEGORÍA'.padEnd(30)}: ${unassigned} productos`);
    }

  } catch (error) {
    console.error('❌ Error asociando productos:', error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  associateProductsToCategories()
    .then(() => {
      console.log('✅ Asociación completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la asociación:', error);
      process.exit(1);
    })
    .finally(() => {
      sequelize.close();
    });
}

module.exports = { associateProductsToCategories };
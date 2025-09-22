console.log('🔍 Loading bulk controller...');

// ========== Imports ==========
const { Product, Category, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// @desc    Test controller
// @route   GET /api/bulk/test
// @access  Public
const testController = (req, res) => {
  console.log('🔍 Test controller called');
  res.json({
    success: true,
    message: 'Bulk controller loaded successfully',
    timestamp: new Date().toISOString()
  });
};

// @desc    Bulk upload products from Excel
// @route   POST /api/bulk/products  
// @access  Private
const bulkUploadProducts = async (req, res) => {
  try {
    console.log('📥 Bulk upload products endpoint hit');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de productos'
      });
    }

    console.log(`📥 Procesando ${products.length} productos desde Excel...`);

    const results = {
      created: [],
      updated: [],
      errors: [],
      categories: {
        created: [],
        existing: []
      }
    };

    // Usar transacción para mantener consistencia
    const transaction = await Product.sequelize.transaction();

    try {
      // 1. Procesar categorías primero
      const uniqueCategories = [...new Set(
        products.map(p => p.category?.toLowerCase()).filter(Boolean)
      )];

      console.log('📋 Categorías únicas encontradas:', uniqueCategories);

      for (const categoryName of uniqueCategories) {
        // ========== CORREGIDO: Usar LIKE en lugar de ILIKE para MariaDB ==========
        const [category, created] = await Category.findOrCreate({
          where: {
            name: {
              [Op.like]: `%${categoryName}%`
            }
          },
          defaults: {
            name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            description: `Categoría ${categoryName}`,
            createdBy: req.user ? req.user.id : 1 // Fallback para testing
          },
          transaction
        });

        if (created) {
          results.categories.created.push(category.name);
          console.log(`✅ Categoría creada: ${category.name}`);
        } else {
          results.categories.existing.push(category.name);
          console.log(`📁 Categoría existente: ${category.name}`);
        }
      }

      // 2. Procesar productos
      for (let i = 0; i < products.length; i++) {
        try {
          const productData = products[i];

          // Validaciones básicas
          if (!productData.name) {
            results.errors.push({
              row: i + 1,
              error: 'Nombre del producto es requerido',
              data: productData
            });
            continue;
          }

          // Buscar categoría si se especifica
          let categoryId = null;
          if (productData.category) {
            // ========== CORREGIDO: Usar LIKE en lugar de ILIKE ==========
            const category = await Category.findOne({
              where: {
                name: {
                  [Op.like]: `%${productData.category}%`
                }
              },
              transaction
            });
            categoryId = category?.id;
          }

          // Generar código único si no existe
          const productCode = productData.code || productData.modelo ||
            productData.name.substring(0, 20).replace(/\s+/g, '').toUpperCase();

          // Preparar datos del producto adaptados a tu modelo
          const productPayload = {
            code: productCode,
            item: productData.name, // Ahora es TEXT, puede ser largo
            para_descripcion: productData.description || productData.name, // ← CORREGIDO

            // Campos específicos de tu formato Excel
            servicio: productData.especialidad || 'GENERAL',
            especialidad: productData.especialidad || 'GENERAL',
            clasificacion: productData.clasificacion || 'PRODUCTO',
            uso: productData.uso || '',
            proveedor: productData.proveedor || 'EXCEL_IMPORT',
            almacen: productData.almacen || 'PRINCIPAL',

            // Precios y factores - NOMBRES CORREGIDOS según tu tabla
            factory_price: productData.priceExw || 0, // ← CORREGIDO
            moneda: (productData.moneda || 'USD').substring(0, 10), // ← Ahora es VARCHAR
            valor_moneda: productData.valorMoneda || 1, // ← CORREGIDO: era valorMoneda
            landed_factor: productData.landenFactor || 1, // ← CORREGIDO: era landenFactor
            margin_factor: productData.marginFactor || 1, // ← CORREGIDO: era marginFactor
            precio_venta_paquete: parseFloat(productData.basePrice) || 0, // ← CORREGIDO

            categoryId: categoryId,
            createdBy: req.user ? req.user.id : 1
          };

          // Buscar si ya existe por código
          const existingProduct = await Product.findOne({
            where: { code: productPayload.code },
            transaction
          });

          if (existingProduct) {
            // Actualizar producto existente
            await existingProduct.update(productPayload, { transaction });
            results.updated.push({
              id: existingProduct.id,
              code: productPayload.code,
              name: productPayload.item
            });
            console.log(`🔄 Producto actualizado: ${productPayload.code}`);
          } else {
            // Crear nuevo producto
            const newProduct = await Product.create(productPayload, { transaction });
            results.created.push({
              id: newProduct.id,
              code: newProduct.code,
              name: newProduct.item
            });
            console.log(`✅ Producto creado: ${newProduct.code}`);
          }

        } catch (productError) {
          console.error(`❌ Error processing product ${i + 1}:`, productError.message);
          results.errors.push({
            row: i + 1,
            error: productError.message,
            data: products[i]
          });
        }
      }

      await transaction.commit();

      const summary = {
        processed: products.length,
        created: results.created.length,
        updated: results.updated.length,
        errors: results.errors.length,
        categoriesCreated: results.categories.created.length
      };

      console.log('✅ Bulk upload completed:', summary);

      res.json({
        success: true,
        message: 'Carga masiva completada',
        data: {
          summary,
          results
        }
      });

    } catch (transactionError) {
      await transaction.rollback();
      console.error('❌ Transaction error:', transactionError);
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la carga masiva',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

// @desc    Bulk upload categories
// @route   POST /api/bulk/categories
// @access  Private
const bulkUploadCategories = async (req, res) => {
  try {
    console.log('📂 Bulk upload categories endpoint hit');

    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de categorías'
      });
    }

    const results = {
      created: [],
      existing: [],
      errors: []
    };

    for (let i = 0; i < categories.length; i++) {
      try {
        const categoryData = categories[i];

        if (!categoryData.name) {
          results.errors.push({
            row: i + 1,
            error: 'Nombre de categoría requerido',
            data: categoryData
          });
          continue;
        }

        // ========== CORREGIDO: Usar LIKE en lugar de ILIKE ==========
        const [category, created] = await Category.findOrCreate({
          where: {
            name: {
              [Op.like]: `%${categoryData.name}%`
            }
          },
          defaults: {
            name: categoryData.name,
            description: categoryData.description || `Categoría ${categoryData.name}`,
            createdBy: req.user ? req.user.id : 1 // Fallback para testing
          }
        });

        if (created) {
          results.created.push(category);
          console.log(`✅ Categoría creada: ${category.name}`);
        } else {
          results.existing.push(category);
          console.log(`📁 Categoría existente: ${category.name}`);
        }

      } catch (categoryError) {
        console.error(`❌ Error processing category ${i + 1}:`, categoryError.message);
        results.errors.push({
          row: i + 1,
          error: categoryError.message,
          data: categories[i]
        });
      }
    }

    const summary = {
      processed: categories.length,
      created: results.created.length,
      existing: results.existing.length,
      errors: results.errors.length
    };

    console.log('✅ Categories upload completed:', summary);

    res.json({
      success: true,
      message: 'Carga de categorías completada',
      data: {
        summary,
        results
      }
    });

  } catch (error) {
    console.error('❌ Bulk categories upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la carga de categorías',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
};

module.exports = {
  bulkUploadProducts,
  bulkUploadCategories,
  testController
};

console.log('🔍 Bulk controller loaded successfully');
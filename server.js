const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const sequelize = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// ========== CORREGIDO: Import models to initialize associations ==========
const { User, Product, Category, Client, Quote } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const quoteRoutes = require('./routes/quotes');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection and sync
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully');
    
    // ========== CORREGIDO: Verificar que las asociaciones están configuradas ==========
    console.log('📋 Models loaded:', Object.keys(sequelize.models));
    
    // Sync database (create tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📊 Database synchronized');
    }
  } catch (error) {
    console.error('❌ MySQL connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'MySQL',
    models: Object.keys(sequelize.models), // ← AGREGADO: para debug
    environment: process.env.NODE_ENV || 'development'
  });
});

// ========== AGREGADO: Endpoint de debug para verificar productos ==========
app.get('/api/debug/products', async (req, res) => {
  try {
    const productCount = await Product.count();
    const categoryCount = await Category.count();
    const products = await Product.findAll({
      limit: 5,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    res.json({
      productCount,
      categoryCount,
      sampleProducts: products,
      message: 'Debug info for products'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: MySQL`);
  console.log(`🔧 Debug endpoint: http://localhost:${PORT}/api/debug/products`);
});
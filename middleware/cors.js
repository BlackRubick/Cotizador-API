const cors = require('cors');

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://52.14.169.93', 'https://cotizador.com']  
    : ['http://52.14.169.93:5000', 'http://localhost:3001', 'http://52.14.169.93'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

module.exports = cors(corsOptions);

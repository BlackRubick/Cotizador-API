# API Cotizador Médico

API REST completa para el sistema de cotizaciones de equipos médicos, construida con Node.js, Express y MongoDB.

## 🚀 Características

- **Autenticación JWT** - Sistema completo de autenticación y autorización
- **Gestión de Usuarios** - Roles de admin, manager y usuario
- **Gestión de Clientes** - CRUD completo con validaciones
- **Catálogo de Productos** - Productos organizados por categorías
- **Sistema de Cotizaciones** - Creación, edición y seguimiento de cotizaciones
- **Validaciones** - Validación de datos con express-validator
- **Paginación** - Paginación en todas las listas
- **Búsqueda y Filtros** - Sistema completo de búsqueda
- **Estadísticas** - Dashboards con métricas del sistema
- **Seguridad** - Helmet, rate limiting, CORS
- **Logging** - Registro de peticiones con Morgan

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MongoDB (v4.4 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd cotizador-api
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cotizador
JWT_SECRET=tu_clave_secreta_muy_segura
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

4. **Inicializar la base de datos**
```bash
npm run seed
```

5. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
cotizador-api/
├── config/          # Configuraciones
├── controllers/     # Controladores de rutas
├── middleware/      # Middlewares personalizados
├── models/         # Modelos de MongoDB
├── routes/         # Definición de rutas
├── services/       # Servicios externos
├── utils/          # Utilidades y helpers
├── data/           # Scripts de datos iniciales
├── server.js       # Punto de entrada
└── package.json
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header de autorización:

```
Authorization: Bearer <tu_token_jwt>
```

### Credenciales por defecto:
- **Admin**: `admin` / `password123`
- **Usuario**: `usuario` / `password123`

## 📚 Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/stats` - Estadísticas de clientes
- `GET /api/clients/:id` - Obtener cliente
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/stats` - Estadísticas de productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Categorías
- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría
- `POST /api/categories` - Crear categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Cotizaciones
- `GET /api/quotes` - Listar cotizaciones
- `GET /api/quotes/stats` - Estadísticas de cotizaciones
- `GET /api/quotes/:id` - Obtener cotización
- `POST /api/quotes` - Crear cotización
- `PUT /api/quotes/:id` - Actualizar cotización
- `PATCH /api/quotes/:id/status` - Cambiar status
- `DELETE /api/quotes/:id` - Eliminar cotización

## 🔍 Parámetros de Consulta

Todas las listas soportan los siguientes parámetros:

- `page` - Número de página (default: 1)
- `limit` - Elementos por página (default: 10)
- `search` - Término de búsqueda
- `sort` - Campo de ordenamiento

### Filtros específicos:

**Clientes:**
- `type` - Tipo de cliente
- `status` - Estado del cliente

**Productos:**
- `category` - ID de categoría
- `brand` - Marca
- `status` - Estado del producto
- `compatibility` - Compatibilidad
- `minPrice` - Precio mínimo
- `maxPrice` - Precio máximo

**Cotizaciones:**
- `status` - Estado de la cotización
- `client` - ID del cliente
- `dateFrom` - Fecha desde
- `dateTo` - Fecha hasta

## 📊 Ejemplos de Uso

### Crear una cotización
```javascript
POST /api/quotes
{
  "client": "64f7d1234567890123456789",
  "clientInfo": {
    "name": "Hospital General",
    "contact": "Dr. Juan Pérez",
    "email": "contacto@hospital.com",
    "phone": "+52 961 123 4567",
    "address": "Av. Central 123, Tuxtla",
    "position": "Jefe de Compras"
  },
  "products": [
    {
      "productId": "64f7d1234567890123456780",
      "quantity": 2,
      "unitPrice": 15500
    }
  ],
  "terms": {
    "paymentConditions": "50% anticipo, 50% contra entrega",
    "deliveryTime": "15 días hábiles",
    "warranty": "12 meses",
    "observations": "Instalación incluida"
  }
}
```

### Buscar productos
```javascript
GET /api/products?search=monitor&category=64f7d123&minPrice=1000&maxPrice=20000&page=1&limit=10
```

## 🚨 Códigos de Error

- `400` - Solicitud incorrecta
- `401` - No autorizado
- `403` - Prohibido
- `404` - No encontrado
- `422` - Entidad no procesable
- `429` - Demasiadas solicitudes
- `500` - Error interno del servidor

## 🧪 Pruebas

```bash
# Ejecutar pruebas
npm test

# Pruebas con cobertura
npm run test:coverage
```

## 📦 Scripts Disponibles

```bash
npm start         # Iniciar servidor en producción
npm run dev       # Iniciar servidor en desarrollo
npm run seed      # Poblar base de datos con datos de ejemplo
npm test          # Ejecutar pruebas
```

## 🔒 Seguridad

- **Helmet** - Configuración de headers de seguridad
- **Rate Limiting** - Límite de 100 peticiones por 15 minutos
- **CORS** - Configurado para el frontend
- **Validación** - Validación exhaustiva de datos
- **Sanitización** - Limpieza de datos de entrada
- **JWT** - Tokens seguros con expiración

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://usuario:password@host:puerto/base_datos
JWT_SECRET=clave_super_secreta_para_produccion
FRONTEND_URL=https://tu-dominio-frontend.com
```

### Con PM2
```bash
npm install -g pm2
pm2 start server.js --name "cotizador-api"
pm2 startup
pm2 save
```


## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: soporte@tuempresa.com
- Teléfono: +52 961 123 4567

## 📋 TODO

- [ ] Implementar envío de emails
- [ ] Generación de PDFs
- [ ] Sistema de notificaciones
- [ ] API de reportes
- [ ] Integración con sistemas de pago
- [ ] Módulo de inventario avanzado
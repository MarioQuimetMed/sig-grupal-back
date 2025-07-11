# 🏢 SIG Grupal Backend API

Sistema de Información Gerencial (SIG) desarrollado con **NestJS** para la gestión empresarial de productos, distribuidores y ventas.

## 🛠️ Tecnologías

- **Framework**: NestJS + TypeScript
- **Base de datos**: MongoDB + TypeORM
- **Autenticación**: JWT + Guards por roles
- **Almacenamiento**: Azure Blob Storage
- **Pagos**: Stripe
- **Validación**: class-validator

---

## 🚀 Configuración e Instalación

### 1. Prerrequisitos
- Node.js 18+
- MongoDB local o MongoDB Compass
- npm

### 2. Instalación
```bash
git clone <repo-url>
cd sig-grupal-back
npm install
```

### 3. Variables de entorno
Crear archivo `.env` en la raíz:

```env
# Servidor
PORT=3001
NODE_ENV=development

# JWT
SECRET_JWT_KEY=tu_clave_jwt_super_secreta_123

# Base de Datos
DB_URL=mongodb://localhost:27017/BackSIG

# Azure Storage (opcional)
CONNECTION_STORAGE=DefaultEndpointsProtocol=https;AccountName=...

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Ejecutar
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build && npm run start:prod
```

**🌐 Servidor disponible en:** `http://localhost:3001`

---

## 📋 API Documentation

### Base URL
```
http://localhost:3001/api
```

### 🔐 Autenticación

Todos los endpoints (excepto login) requieren token JWT en el header:
```
Authorization: Bearer <jwt-token>
```

---

## 🛡️ Endpoints de Autenticación

### 📝 Login
```http
POST /api/auth/sign-in
```

**Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "_id": "64f...",
      "name": "Admin User",
      "email": "admin@gmail.com",
      "role": "admin"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 👥 Endpoints de Distribuidores

> **Permisos:** Solo ADMIN

### 📋 Listar distribuidores
```http
GET /api/distribuitors?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Elementos por página (default: 10)

### ➕ Crear distribuidor
```http
POST /api/distribuitors
```

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "capacity": 50,
  "type_vehicle": "Camión",
  "cellphone": "+59170123456"
}
```

### ✏️ Actualizar distribuidor
```http
PUT /api/distribuitors/:id
```

**Body:** Mismo que crear (campos opcionales)

### 🗑️ Eliminar distribuidor
```http
DELETE /api/distribuitors/:id
```

### 📤 Crear distribuidores masivos (CSV)
```http
POST /api/distribuitors/bulk-create-distribuitors
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [archivo.csv]
```

**Formato CSV esperado:**
```csv
name,email,capacity,type_vehicle,cellphone
Juan Pérez,juan@example.com,50,Camión,+59170123456
María López,maria@example.com,30,Motocicleta,+59175123456
```

---

## 📦 Endpoints de Productos

> **Permisos:** Solo ADMIN

### 📋 Listar productos
```http
GET /api/product?page=1&limit=10
```

### ➕ Crear producto
```http
POST /api/product
Content-Type: multipart/form-data
```

**Form Data:**
```
name: Producto Ejemplo
description: Descripción del producto
stock: 100
price: 25.50
photo: [archivo-imagen] (opcional)
```

### ✏️ Actualizar producto
```http
PATCH /api/product/:productId
```

**Body:**
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "stock": 150,
  "price": 30.00
}
```

### 🖼️ Actualizar imagen de producto
```http
PATCH /api/product/update-image/:productId
Content-Type: multipart/form-data
```

**Form Data:**
```
photo: [archivo-imagen]
```

### 🗑️ Eliminar producto
```http
DELETE /api/product/:productId
```

---

## 💰 Endpoints de Ventas

> **Permisos:** CLIENT

### 📋 Listar ventas
```http
GET /api/sales
```

---

## 🏗️ Modelos de Datos

### 👤 Usuario
```typescript
{
  _id: string;
  name: string;
  email: string;
  password: string; // encriptado
  status: boolean;
  role: "admin" | "distributor" | "client";
  distribuitor?: {
    capacity: number;
    type_vehicle: string;
    cellphone: string;
  };
  client_detail?: {
    address: string;
    city: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 📦 Producto
```typescript
{
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: boolean;
  img_url?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🎭 Roles de Usuario

- **ADMIN**: Acceso completo a distribuidores y productos
- **DISTRIBUTOR**: Acceso limitado (por implementar)
- **CLIENT**: Acceso a ventas

---

## 📱 Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | ✅ Exitoso |
| 201 | ✅ Creado exitosamente |
| 400 | ❌ Datos inválidos |
| 401 | ❌ No autorizado |
| 403 | ❌ Sin permisos |
| 404 | ❌ No encontrado |
| 500 | ❌ Error del servidor |

---

## 🔧 Estructura de Respuesta

Todas las respuestas siguen el formato:

```json
{
  "statusCode": 200,
  "message": "Mensaje descriptivo",
  "data": { /* datos de respuesta */ }
}
```

**Para paginación:**
```json
{
  "statusCode": 200,
  "message": "Mensaje descriptivo",
  "data": {
    "items": [...],
    "meta": {
      "totalItems": 50,
      "itemsPerPage": 10,
      "currentPage": 1,
      "totalPages": 5
    }
  }
}
```

---

## 🧪 Ejemplos para Frontend

### Login con fetch
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/api/auth/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

### Obtener productos con token
```javascript
const getProducts = async (token, page = 1) => {
  const response = await fetch(`http://localhost:3001/api/product?page=${page}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### Crear producto con imagen
```javascript
const createProduct = async (token, productData) => {
  const formData = new FormData();
  formData.append('name', productData.name);
  formData.append('description', productData.description);
  formData.append('stock', productData.stock);
  formData.append('price', productData.price);
  if (productData.photo) {
    formData.append('photo', productData.photo);
  }

  const response = await fetch('http://localhost:3001/api/product', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

---

## 🚀 Para Desarrolladores Frontend

### Configuración recomendada:
1. **Base URL**: `http://localhost:3001/api`
2. **Headers por defecto**: 
   ```javascript
   {
     'Content-Type': 'application/json',
     'Authorization': 'Bearer <token>'
   }
   ```
3. **Manejo de errores**: Verificar `statusCode` en respuesta
4. **Almacenamiento de token**: localStorage/sessionStorage
5. **Interceptors**: Para agregar token automáticamente

### Estados de carga recomendados:
- **Loading**: Durante petición
- **Success**: Respuesta exitosa (200-299)
- **Error**: Error de cliente/servidor (400+)

---

## 📞 Contacto

Para dudas o problemas con la API, contacta al equipo backend.

**🌟 Happy Coding!**

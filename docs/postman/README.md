# 📮 Postman Collection - Animecream API

## 🎯 Descripción

Colección completa de Postman para la API de Animecream con todos los módulos (Auth, Finan, Series) y ambientes configurados (Local y Producción).

## 📁 Archivos Incluidos

### Colección Principal

- **`Animecream-API.postman_collection.json`** - Colección completa con todos los endpoints

### Ambientes

- **`Animecream-Local.postman_environment.json`** - Ambiente de desarrollo local
- **`Animecream-Production.postman_environment.json`** - Ambiente de producción
- **`Animecream-Environments.postman_environment.json`** - Ambiente base

### Documentación

- **`POSTMAN_README.md`** - Guía completa de uso de Postman

## 🚀 Configuración Rápida

### 1. Importar en Postman

1. Abrir Postman
2. Click en **Import**
3. Seleccionar los archivos `.json` de la colección y ambientes
4. Importar todos los archivos

### 2. Configurar Ambientes

1. Seleccionar el ambiente deseado:
   - **Local**: `http://localhost:3001`
   - **Production**: `https://info.animecream.com`

### 3. Configurar Variables

- **`base_url`**: URL base de la API
- **`auth_token`**: Token JWT para autenticación
- **`user_id`**: ID del usuario autenticado
- **`username`**: Nombre de usuario
- **`email`**: Email del usuario

## 📦 Módulos Incluidos

### 🔐 Auth Module

- **User Registration** - Registro de nuevos usuarios
- **User Login (Email)** - Login con email
- **User Login (Username)** - Login con username

### 📺 Series Module

- **Search Series** - Búsqueda principal con filtros
- **Get All Series** - Lista paginada de series
- **Get Series by ID** - Obtener serie específica
- **Get Production Years** - Años de producción disponibles
- **Create Series** - Crear nueva serie (con imagen)
- **Update Series** - Actualizar serie existente
- **Delete Series** - Eliminar serie
- **Update Series Image** - Actualizar solo imagen
- **Search Series Advanced** - Búsqueda avanzada

### 💰 Finan Module

- **Initial Load** - Carga inicial de datos financieros
- **Create Movement** - Crear movimiento financiero
- **Update Movement** - Actualizar movimiento
- **Delete Movement** - Eliminar movimiento

### 🏥 Health & Status

- **Health Check** - Estado detallado de la API
- **API Status** - Estado básico
- **API Endpoint** - Endpoint de API

### 📚 Documentation

- **Swagger Documentation** - Documentación interactiva

## 🔑 Autenticación

### Flujo de Autenticación

1. **Registrar usuario** o **Hacer login**
2. **Copiar el token** de la respuesta
3. **Configurar variable** `auth_token` en el ambiente
4. **Usar endpoints protegidos** (Series CRUD, Finan)

### Headers de Autenticación

Los endpoints protegidos requieren:

```
Authorization: Bearer {{auth_token}}
```

## 🧪 Testing

### Tests Automáticos

La colección incluye tests automáticos para:

- Verificar códigos de respuesta
- Validar estructura de respuestas
- Guardar tokens automáticamente

### Scripts de Pre-request

- Configuración automática de headers
- Validación de variables de ambiente

## 📊 Ejemplos de Uso

### 1. Búsqueda de Series

```json
POST /api/series/
{
  "production_name": "Neon Genesis Evangelion",
  "production_year": 1995,
  "demographic_name": "Shōnen-Seinen",
  "limit": "10"
}
```

### 2. Crear Serie (con imagen)

```
POST /api/series/create
Content-Type: multipart/form-data
Authorization: Bearer {{auth_token}}

name: Attack on Titan
chapter_number: 25
year: 2013
description: Una serie de anime...
qualification: 9.5
demography_id: 1
visible: true
image: [archivo de imagen]
```

### 3. Login de Usuario

```json
POST /api/users/login
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

## 🔧 Configuración Avanzada

### Variables de Ambiente

- **Local**: `http://localhost:3001`
- **Production**: `https://info.animecream.com`

### Headers Comunes

- **Content-Type**: `application/json`
- **Authorization**: `Bearer {{auth_token}}`

### Parámetros de Query

- **limit**: Número de resultados (default: 50)
- **offset**: Paginación (default: 0)

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error 401**: Token de autenticación inválido o expirado
2. **Error 404**: Endpoint no encontrado
3. **Error 500**: Error interno del servidor

### Soluciones

1. **Verificar ambiente**: Asegurar que el ambiente correcto esté seleccionado
2. **Renovar token**: Hacer login nuevamente para obtener nuevo token
3. **Verificar URL**: Confirmar que la URL base sea correcta

### Comandos de Diagnóstico

```bash
# Verificar servidor local
curl http://localhost:3001/health

# Verificar servidor de producción
curl https://info.animecream.com/health
```

## 📝 Notas Importantes

### Seguridad

- Los tokens JWT tienen tiempo de expiración
- Usar HTTPS en producción
- No compartir tokens en repositorios públicos

### Limitaciones

- Rate limiting en endpoints públicos
- Tamaño máximo de imagen: 5MB
- Límite de resultados: 10,000 por consulta

### Mejores Prácticas

- Usar variables de ambiente para URLs
- Guardar tokens automáticamente
- Validar respuestas con tests
- Documentar cambios en la API

## 🤝 Contribución

Para actualizar la colección:

1. Modificar los archivos `.json`
2. Exportar desde Postman
3. Actualizar este README
4. Commit y push de cambios

## 📞 Soporte

Para soporte técnico:

- Revisar logs del servidor
- Verificar configuración de ambiente
- Consultar documentación Swagger
- Crear issue en el repositorio

---

**Última actualización**: 2025-09-28

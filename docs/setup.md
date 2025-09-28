# Configuración del Proyecto

## 📋 Requisitos del Sistema

### Software Requerido

- **Node.js**: 12.22.9 (usando nvm)
- **Docker Desktop**: Para contenedores
- **Git**: Control de versiones
- **MySQL Client**: Para administración de BD (opcional)

### Hardware Mínimo

- **RAM**: 4GB mínimo, 8GB recomendado
- **Disco**: 2GB de espacio libre
- **CPU**: 2 cores mínimo

## 🚀 Instalación Paso a Paso

### 1. Configurar Node.js

```bash
# Instalar nvm (si no lo tienes)
# Windows: https://github.com/coreybutler/nvm-windows

# Instalar Node.js 12.22.9
nvm install 12.22.9
nvm use 12.22.9

# Verificar instalación
node --version  # Debe mostrar v12.22.9
npm --version
```

### 2. Clonar el Repositorio

```bash
# Clonar el repositorio
git clone <repository-url>
cd module-api

# Verificar que estás en la rama correcta
git branch
```

### 3. Instalar Dependencias

```bash
# Instalar dependencias del proyecto
npm install

# Verificar que no hay errores
npm run build
```

### 4. Configurar Docker

```bash
# Navegar al directorio docker
cd docker

# Verificar que Docker Desktop esté ejecutándose
docker --version
docker ps

# Construir y ejecutar contenedores
docker-compose up -d --build

# Verificar que los contenedores estén ejecutándose
docker ps
```

### 5. Configurar Variables de Entorno

```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env

# Editar variables según tu entorno
nano .env
```

### 6. Inicializar Base de Datos

```bash
# Los scripts SQL se ejecutan automáticamente
# Verificar que las bases de datos se crearon
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB

# Logging
LOG_LEVEL=debug
```

### Scripts de Desarrollo

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar con hot reload
npm run dev:watch

# Ejecutar tests
npm test

# Tests con cobertura
npm run test:cov

# Linting
npm run lint

# Formateo de código
npm run format
```

## 🐳 Configuración Docker

### Estructura de Contenedores

```yaml
# docker-compose.yml
services:
  mariadb:
    image: mariadb:10.3.39
    ports:
      - '3306:3306'
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_USER: animecream
      MYSQL_PASSWORD: animecream123
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d
```

### Comandos Docker Útiles

```bash
# Iniciar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f mariadb

# Detener contenedores
docker-compose down

# Reconstruir contenedores
docker-compose up -d --build

# Acceder al contenedor
docker exec -it animecream-mariadb mysql -u root -p

# Limpiar volúmenes (CUIDADO: Borra datos)
docker-compose down -v
```

## 🗄️ Configuración de Base de Datos

### Bases de Datos Creadas

- **animecre_auth**: Autenticación y usuarios
- **animecre_cake514**: Base de datos principal
- **animecre_finan**: Módulo financiero
- **animecre_series**: Módulo de series

### Conexión desde el Backend

```typescript
// Configuración de conexión
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'animecream',
  password: process.env.DB_PASSWORD || 'animecream123',
  database: process.env.DB_NAME || 'animecre_auth',
  charset: 'utf8mb4',
  timezone: 'Z',
};
```

## 🔐 Configuración de Seguridad

### JWT Configuration

```typescript
// Configuración JWT
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256',
};
```

### Password Hashing

```typescript
// Configuración bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

## 📊 Configuración de Logging

### Winston Configuration

```typescript
// Configuración de logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

## 🧪 Configuración de Testing

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.{js,ts}', '!src/**/*.d.ts', '!src/server.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Database

```bash
# Configurar base de datos de testing
# Los tests usan una base de datos separada
DB_TEST_NAME=animecre_test
```

## 🚀 Configuración de Producción

### Variables de Entorno de Producción

```env
# Producción
NODE_ENV=production
PORT=3001

# Base de datos de producción
DB_HOST=production-db-host
DB_PORT=3306
DB_USER=production-user
DB_PASSWORD=production-password

# JWT de producción
JWT_SECRET=super-secure-production-secret

# Logging de producción
LOG_LEVEL=warn
```

### Optimizaciones de Producción

```bash
# Build para producción
npm run build

# Iniciar en producción
npm start

# PM2 para gestión de procesos
npm install -g pm2
pm2 start dist/server.js --name "module-api"
```

## 🔍 Verificación de la Instalación

### Checklist de Verificación

- [ ] Node.js 12.22.9 instalado y configurado
- [ ] Docker Desktop ejecutándose
- [ ] Contenedores de base de datos ejecutándose
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas sin errores
- [ ] Servidor iniciando correctamente
- [ ] Base de datos accesible
- [ ] API respondiendo en http://localhost:3001

### Comandos de Verificación

```bash
# Verificar Node.js
node --version

# Verificar Docker
docker --version
docker ps

# Verificar base de datos
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# Verificar servidor
curl http://localhost:3001/health

# Verificar API
curl http://localhost:3001/api
```

## 🐛 Solución de Problemas Comunes

### Error: Node.js versión incorrecta

```bash
# Solución
nvm use 12.22.9
```

### Error: Docker no ejecutándose

```bash
# Solución
# Iniciar Docker Desktop desde el menú de inicio
```

### Error: Puerto ya en uso

```bash
# Solución
# Cambiar puerto en .env o docker-compose.yml
```

### Error: Base de datos no accesible

```bash
# Solución
docker-compose down
docker-compose up -d --build
```

---

**Última actualización**: 2024-09-28

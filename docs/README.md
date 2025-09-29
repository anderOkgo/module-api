# Module-API - Documentación Completa

## 📋 Índice

- [🏠 Inicio](README.md)
- [📦 Arquitectura General](architecture.md)
- [🔧 Configuración del Proyecto](setup.md)
- [🐳 Docker Setup](docker-setup.md)
- [🔐 Módulo de Autenticación (@auth/)](modules/auth.md)
- [💰 Módulo Financiero (@finan/)](modules/finan.md)
- [📺 Módulo de Series (@series/)](modules/series.md)
- [🗄️ Bases de Datos](databases.md)
- [🚀 Despliegue](deployment.md)
- [🐛 Troubleshooting](troubleshooting.md)
- [📮 Postman Collection](postman/README.md)

## 📁 Configuración de Archivos en Producción

### Symlinks en cPanel

El proyecto utiliza symlinks para gestionar archivos de imágenes en producción:

- **Carpeta real**: `/home/animecre/public_html/webroot/img/tarjeta`
- **Carpeta espejo**: `/home/animecre/info.animecream.com/uploads/series/img/tarjeta`

Esta configuración permite que los archivos se almacenen físicamente en la carpeta web accesible, pero la aplicación los guarde usando la ruta estándar de uploads. Ver [Deployment](deployment.md#configuración-de-carpetas-y-symlinks-en-cpanel) para más detalles.

## 📮 Postman Collection

### Estructura Organizada

Todos los archivos de Postman están organizados en `docs/postman/`:

- **`docs/postman/Animecream-API.postman_collection.json`** - Colección completa con todos los endpoints
- **`docs/postman/Animecream-Local.postman_environment.json`** - Ambiente local (`http://localhost:3001`)
- **`docs/postman/Animecream-Production.postman_environment.json`** - Ambiente producción (`https://info.animecream.com`)
- **`docs/postman/Animecream-Environments.postman_environment.json`** - Ambiente base
- **`docs/postman/README.md`** - Guía completa de uso

### Uso Rápido

1. Importar los archivos `.json` desde `docs/postman/` en Postman
2. Seleccionar el ambiente deseado (Local/Production)
3. Configurar variables de autenticación
4. ¡Listo para usar!

Ver [Postman Collection](postman/README.md) para documentación completa.

## 🎯 Descripción General

**Module-API** es un proyecto backend desarrollado en Node.js que implementa una arquitectura modular para la gestión de anime y series. El proyecto utiliza Clean Architecture y Hexagonal Architecture para mantener un código limpio, mantenible y escalable.

## 🏗️ Arquitectura del Proyecto

```
module-api/
├── src/
│   ├── modules/           # Módulos de la aplicación
│   │   ├── auth/          # Autenticación y usuarios
│   │   ├── finan/         # Gestión financiera
│   │   └── series/        # Gestión de series/anime
│   ├── infrastructure/    # Capa de infraestructura
│   └── server.ts         # Punto de entrada
├── docker/               # Configuración Docker
├── docs/                 # Documentación
└── package.json
```

## 🛠️ Tecnologías Utilizadas

### Backend

- **Node.js**: 12.22.9 (usando nvm)
- **TypeScript**: Para tipado estático
- **Express.js**: Framework web
- **JWT**: Autenticación
- **bcrypt**: Encriptación de contraseñas

### Base de Datos

- **MariaDB**: 10.3.39 (contenedor Docker)
- **MySQL**: Compatible con MariaDB

### Infraestructura

- **Docker**: Contenedores
- **Docker Compose**: Orquestación
- **Sharp**: Procesamiento de imágenes
- **Multer**: Upload de archivos

### Desarrollo

- **Swagger**: Documentación de API
- **Jest**: Testing
- **ESLint**: Linting
- **Prettier**: Formateo de código

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 12.22.9 (usar `nvm use 12.22.9`)
- Docker Desktop
- Git

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd module-api

# Configurar Node.js
nvm use 12.22.9

# Instalar dependencias
npm install

# Configurar Docker
cd docker
docker-compose up -d --build

# Iniciar el servidor
npm run dev
```

## 📊 Módulos del Sistema

### 🔐 @auth/ - Autenticación

- Registro de usuarios
- Login con JWT
- Gestión de sesiones
- Validaciones de seguridad

### 💰 @finan/ - Financiero

- Gestión de movimientos
- Categorías de gastos
- Reportes financieros
- Análisis de gastos

### 📺 @series/ - Series

- CRUD de series/anime
- Gestión de imágenes
- Categorización por géneros
- Búsqueda y filtrado

## 🗄️ Bases de Datos

El sistema utiliza múltiples bases de datos organizadas por módulo:

- **animecre_auth**: Autenticación y usuarios
- **animecre_cake514**: Base de datos principal
- **animecre_finan**: Módulo financiero
- **animecre_series**: Módulo de series

## 🔧 Configuración

### Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# JWT
JWT_SECRET=your-secret-key

# Servidor
PORT=3001
NODE_ENV=development
```

### Docker

```bash
# Iniciar contenedores
cd docker
docker-compose up -d

# Ver logs
docker-compose logs -f mariadb
```

## 📚 Documentación de API

La documentación de la API está disponible en Swagger:

- **URL**: http://localhost:3001/api-docs
- **Autenticación**: Bearer Token (JWT)

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch
```

## 🚀 Despliegue

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## 📝 Contribución

1. Fork el proyecto
2. Crear una rama para la feature (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Desarrollador Principal**: [Tu Nombre]
- **Email**: [tu-email@ejemplo.com]

## 📞 Soporte

Para soporte, por favor contacta:

- **Email**: [soporte@ejemplo.com]
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/module-api/issues)

---

**Última actualización**: 2024-09-28
**Versión**: 2.0.9

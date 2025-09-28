# Module-API

API modular construida con **Arquitectura Hexagonal**, **Clean Architecture** y principios **SOLID**. Proyecto backend para el ecosistema Animecream con módulos especializados en autenticación, finanzas y series.

## 🏗️ Arquitectura

### Principios Arquitectónicos

- **Hexagonal Architecture (Ports & Adapters)**: Desacoplamiento del dominio de las dependencias externas
- **Clean Architecture**: Separación clara entre capas (Domain, Application, Infrastructure)
- **SOLID Principles**: Código mantenible y extensible
- **Factory Pattern**: Inyección de dependencias limpia y testeable

### Estructura del Proyecto

```
src/
├── infrastructure/          # Capa de infraestructura global
│   ├── lib/                # Implementaciones core
│   ├── data/               # Conexiones a base de datos
│   └── routes/             # Rutas globales
├── modules/                 # Módulos especializados
│   ├── auth/               # Módulo de autenticación
│   ├── finan/              # Módulo financiero
│   └── series/             # Módulo de series
└── docs/                   # Documentación completa
```

## 🚀 Tecnologías

### Backend

- **Node.js**: 12.22.9 (usar `nvm use 12.22.9`)
- **TypeScript**: 4.9.5 (compatible con Node.js 12)
- **Express**: Framework web
- **MySQL/MariaDB**: Base de datos (Docker)
- **Sharp**: 0.30.7 (procesamiento de imágenes)
- **JWT**: Autenticación
- **Swagger**: Documentación API

### Base de Datos

- **MariaDB**: 10.3.39 (Docker)
- **Múltiples bases de datos**:
  - `animecre_auth`: Autenticación
  - `animecre_cake514`: Base principal
  - `animecre_finan`: Finanzas
  - `animecre_series`: Series

## 📦 Módulos

### 🔐 Auth Module (`@auth/`)

- **Registro de usuarios** con validaciones robustas
- **Login** con email o username
- **Seguridad**: bloqueo de cuentas, intentos de login
- **JWT**: Tokens de autenticación

### 💰 Finan Module (`@finan/`)

- **Gestión financiera** completa
- **Procedimientos almacenados** para cálculos complejos
- **Reportes** de gastos y balances
- **Autenticación** requerida para operaciones

### 📺 Series Module (`@series/`)

- **CRUD completo** de series
- **Subida de imágenes** optimizadas (190x285px, ~20KB)
- **Búsqueda avanzada** con filtros
- **Autenticación** para operaciones de escritura

## 🐳 Docker Setup

### Requisitos

- **Docker Desktop** ejecutándose
- **Node.js 12.22.9** (`nvm use 12.22.9`)

### Inicio Rápido

```bash
# 1. Configurar Node.js
nvm use 12.22.9

# 2. Navegar al directorio docker
cd docker

# 3. Ejecutar contenedor
docker-compose up -d --build

# 4. Verificar que esté funcionando
docker ps
```

### Acceso a Base de Datos

- **Host**: localhost
- **Puerto**: 3306
- **Usuario root**: root / **Contraseña**: root
- **Usuario**: animecream / **Contraseña**: animecream123

## 🛠️ Desarrollo

### Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd module-api

# Instalar dependencias
npm install

# Configurar Node.js
nvm use 12.22.9
```

### Scripts Disponibles

```bash
# Desarrollo (compilación + servidor)
npm run servers

# Solo compilación
npx tsc

# Ejecutar servidor
node dist/index.js
```

### Endpoints Principales

- **`GET /`**: Estado básico de la API
- **`GET /health`**: Estado detallado con verificación de BD
- **`GET /api-docs`**: Documentación Swagger
- **`POST /api/users/login`**: Autenticación
- **`POST /api/series/create``**: Crear serie (con imagen)

## 📚 Documentación

### Documentación Completa

- **`docs/README.md`**: Índice general
- **`docs/architecture.md`**: Arquitectura detallada
- **`docs/setup.md`**: Configuración del proyecto
- **`docs/docker-setup.md`**: Configuración Docker
- **`docs/modules/`**: Documentación por módulo

### Módulos Documentados

- **`docs/modules/auth.md`**: Módulo de autenticación
- **`docs/modules/finan.md`**: Módulo financiero
- **`docs/modules/series.md`**: Módulo de series

## 🔧 Configuración

### Variables de Entorno

El proyecto usa valores por defecto del `docker-compose.yml`:

- **MYSQL_ROOT_PASSWORD**: root
- **MYSQL_USER**: animecream
- **MYSQL_PASSWORD**: animecream123
- **MARIADB_PORT**: 3306

### Compatibilidad

- **Node.js**: 12.22.9 (requerido)
- **TypeScript**: 4.9.5 (compatible con Node.js 12)
- **Sharp**: 0.30.7 (compatible con Node.js 12)

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de compatibilidad Node.js**: Usar `nvm use 12.22.9`
2. **Sharp no funciona**: Verificar versión 0.30.7
3. **Docker no inicia**: Verificar que Docker Desktop esté ejecutándose
4. **Base de datos no conecta**: Verificar credenciales y puerto

### Comandos de Diagnóstico

```bash
# Verificar versión de Node.js
node --version

# Verificar contenedores Docker
docker ps

# Verificar conexión a BD
curl http://localhost:3001/health
```

## 📄 Licencia

Este proyecto está licenciado bajo la **MIT License**.

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:

- Revisar la documentación en `docs/`
- Verificar la sección de troubleshooting
- Crear un issue en el repositorio

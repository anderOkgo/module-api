# Docker Setup para Module-API - MariaDB

Este directorio contiene la configuración Docker para ejecutar MariaDB 10.3.39 localmente, alojando todas las bases de datos de los módulos del proyecto module-api (auth, finan, series, main).

## 📋 Requisitos del Sistema

### Tecnologías Utilizadas

- **Node.js**: 12.22.9 (usando nvm)
- **Docker**: Docker Desktop para Windows
- **MariaDB**: 10.3.39 (contenedor Docker)
- **Sistema Operativo**: Windows 10/11

### Prerrequisitos

- Docker Desktop instalado y ejecutándose
- Node.js 12.22.9 (usar `nvm use 12.22.9`)
- Cliente MySQL (opcional, para administración)

## 🚀 Inicio Rápido

### Configuración del Entorno

```bash
# 1. Configurar Node.js (si usas nvm)
nvm use 12.22.9

# 2. Verificar que Docker Desktop esté ejecutándose
docker --version
docker ps

# 3. Navegar al directorio docker
cd D:\Proyectos\module-api\docker
```

### Ejecutar Contenedor

```bash
# Construir y ejecutar
docker-compose up -d --build

# Ver logs
docker-compose logs -f mariadb

# Verificar que esté funcionando
docker ps
```

## 📊 Acceso a las Bases de Datos

### MariaDB Unificado (Todas las bases de datos)

- **Host**: localhost
- **Puerto**: 3306
- **Usuario root**: root / **Contraseña**: root
- **Usuario**: animecream / **Contraseña**: animecream123

#### Bases de Datos Disponibles (según docker-compose.yml):

- **animecre_auth**: Módulo de autenticación (@auth/)
  - Tablas: users, email_verification
  - Scripts: db-structure.sql, migration-add-security-fields.sql
- **animecre_cake514**: Base de datos principal de animecream
  - Tablas: productions, demographics, genres, productions_genres
  - Scripts: db-structure.sql, db-data.sql
- **animecre_finan**: Módulo financiero (@finan/)
  - Tablas: movements, categories
  - Scripts: db-financial-procedures.sql
- **animecre_series**: Módulo de series (@series/)
  - Tablas: productions, demographics, genres, productions_genres
  - Scripts: setup-series-module.sql

### Acceso a Base de Datos

- **Cliente MySQL**: Usar cualquier cliente MySQL (MySQL Workbench, DBeaver, etc.)
- **Línea de comandos (root)**: `mysql -h localhost -P 3306 -u root -p`
- **Línea de comandos (usuario)**: `mysql -h localhost -P 3306 -u animecream -p`

## 🛠️ Comandos Útiles

### Construir imagen

```bash
docker-compose build
```

### Ejecutar en segundo plano

```bash
docker-compose up -d
```

### Ver logs

```bash
docker-compose logs -f mariadb
```

### Detener servicios

```bash
docker-compose down
```

### Eliminar volúmenes (CUIDADO: Borra todos los datos)

```bash
docker-compose down -v
```

### Acceder al contenedor

```bash
docker exec -it animecream-mariadb mysql -u root -p
```

## 📁 Estructura de Archivos

```
docker/
├── Dockerfile                 # Imagen personalizada de MariaDB
├── docker-compose.yml        # Configuración unificada
├── README.md                 # Este archivo
├── scripts/                  # Scripts de utilidad
│   ├── check-env.sh          # Verificar variables de entorno
│   └── verify-modules.sh     # Verificar módulos
└── sql/                      # Scripts SQL de inicialización
    ├── 00-create-module-databases.sql
    ├── 01-setup-auth-module.sql
    ├── 02-setup-main-database.sql
    ├── 03-setup-finan-module.sql
    ├── 04-setup-series-module.sql
    └── 99-verify-databases.sql
```

## 🔧 Configuración del Proyecto

### Configuración de Conexión

**Configuración por defecto del contenedor:**

- **Host**: localhost
- **Puerto**: 3306
- **Usuario root**: root
- **Contraseña root**: root
- **Usuario**: animecream
- **Contraseña**: animecream123

**Bases de datos disponibles:**

- `animecre_auth` - Módulo de autenticación
- `animecre_cake514` - Base de datos principal
- `animecre_finan` - Módulo financiero
- `animecre_series` - Módulo de series

### Configuración para Module-API

**Variables de entorno recomendadas para el backend:**

```env
# Configuración de base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# Nombres de las bases de datos por módulo
DB_AUTH_NAME=animecre_auth
DB_MAIN_NAME=animecre_cake514
DB_FINAN_NAME=animecre_finan
DB_SERIES_NAME=animecre_series
```

### Conexión desde el Backend

```typescript
// Configuración base para todas las conexiones
const baseConfig = {
  host: 'localhost',
  port: 3306,
  user: 'animecream',
  password: 'animecream123',
};

// Configuraciones específicas por módulo
const dbConfigs = {
  auth: { ...baseConfig, database: 'animecre_auth' },
  main: { ...baseConfig, database: 'animecre_cake514' },
  finan: { ...baseConfig, database: 'animecre_finan' },
  series: { ...baseConfig, database: 'animecre_series' },
};
```

## 🐛 Troubleshooting

### Docker Desktop no está ejecutándose

```bash
# Verificar estado de Docker
docker --version
docker ps

# Si no funciona, iniciar Docker Desktop desde el menú de inicio
# Esperar a que aparezca el ícono de Docker en la bandeja del sistema
```

### Puerto ya en uso

```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3307:3306"  # Cambiar 3307 por otro puerto disponible
```

### Problemas de permisos

```bash
# En Windows, ejecutar como administrador
# En Linux/Mac, usar sudo si es necesario
sudo docker-compose up -d
```

### Node.js no está en la versión correcta

```bash
# Verificar versión actual
node --version

# Cambiar a Node.js 12.22.9 (si usas nvm)
nvm use 12.22.9

# Verificar que el cambio fue exitoso
node --version
```

### Reiniciar desde cero

```bash
# Detener y eliminar todo
docker-compose down -v

# Reconstruir y ejecutar
docker-compose up -d --build
```

### Verificar que las bases de datos se crearon correctamente

```bash
# Ejecutar script de verificación
./scripts/verify-modules.sh

# O verificar manualmente
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"
```

## 📝 Notas

### Características del Setup

- Los datos se persisten en volúmenes Docker
- Los scripts SQL se ejecutan automáticamente al crear el contenedor
- Se crean automáticamente todas las bases de datos de los módulos
- La configuración permite múltiples bases de datos sin limitaciones
- Usa valores por defecto del Dockerfile y docker-compose.yml

### Tecnologías y Versiones

- **Node.js**: 12.22.9 (usar `nvm use 12.22.9`)
- **Docker**: Docker Desktop para Windows
- **MariaDB**: 10.3.39 (contenedor)
- **Sistema**: Windows 10/11

### Estructura de Volúmenes

```
docker/
├── mariadb_data/          # Datos persistentes de MariaDB
├── logs/                  # Logs del contenedor
└── sql/                   # Scripts de inicialización
```

### Comandos de Desarrollo

```bash
# Iniciar entorno completo
nvm use 12.22.9
cd D:\Proyectos\module-api\docker
docker-compose up -d --build

# Ver logs en tiempo real
docker-compose logs -f mariadb

# Acceder a la base de datos
docker exec -it animecream-mariadb mysql -u root -p
```

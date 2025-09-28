# Docker Setup - Module-API

## 🐳 Configuración Docker

Este documento describe la configuración Docker para el proyecto Module-API, incluyendo MariaDB 10.3.39 y todas las bases de datos de los módulos.

## 📋 Requisitos

### Software Requerido

- **Docker Desktop**: Para Windows
- **Docker Compose**: Incluido en Docker Desktop
- **Git**: Para clonar el repositorio

### Hardware Mínimo

- **RAM**: 4GB mínimo, 8GB recomendado
- **Disco**: 5GB de espacio libre
- **CPU**: 2 cores mínimo

## 🚀 Inicio Rápido

### 1. Verificar Docker Desktop

```bash
# Verificar que Docker esté instalado
docker --version

# Verificar que Docker Desktop esté ejecutándose
docker ps

# Si no funciona, iniciar Docker Desktop desde el menú de inicio
```

### 2. Configurar Node.js

```bash
# Configurar Node.js 12.22.9
nvm use 12.22.9

# Verificar versión
node --version  # Debe mostrar v12.22.9
```

### 3. Ejecutar Contenedores

```bash
# Navegar al directorio docker
cd D:\Proyectos\module-api\docker

# Construir y ejecutar contenedores
docker-compose up -d --build

# Ver logs
docker-compose logs -f mariadb

# Verificar que esté funcionando
docker ps
```

## 🏗️ Arquitectura Docker

### Estructura de Contenedores

```
┌─────────────────────────────────────┐
│           Docker Host                │
│  ┌─────────────────────────────────┐ │
│  │      MariaDB Container         │ │
│  │  ┌─────────────────────────┐   │ │
│  │  │   animecre_auth         │   │ │
│  │  │   animecre_cake514      │   │ │
│  │  │   animecre_finan        │   │ │
│  │  │   animecre_series       │   │ │
│  │  └─────────────────────────┘   │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Configuración de Red

```yaml
# docker-compose.yml
networks:
  animecream-network:
    driver: bridge
```

## 📊 Bases de Datos

### Bases de Datos Creadas

| Base de Datos      | Módulo   | Descripción              |
| ------------------ | -------- | ------------------------ |
| `animecre_auth`    | @auth/   | Autenticación y usuarios |
| `animecre_cake514` | main     | Base de datos principal  |
| `animecre_finan`   | @finan/  | Módulo financiero        |
| `animecre_series`  | @series/ | Módulo de series         |

### Scripts SQL de Inicialización

```
sql/
├── 00-create-module-databases.sql    # Crear todas las bases de datos
├── 01-setup-auth-module.sql          # Configurar módulo de autenticación
├── 02-setup-main-database.sql        # Configurar base de datos principal
├── 03-setup-finan-module.sql         # Configurar módulo financiero
├── 04-setup-series-module.sql        # Configurar módulo de series
└── 99-verify-databases.sql           # Verificar que todo se creó correctamente
```

## 🔧 Configuración Detallada

### Dockerfile

```dockerfile
# Dockerfile para MariaDB 10.3.39
FROM mariadb:10.3.39

# Configurar variables de entorno por defecto
ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_USER=animecream
ENV MYSQL_PASSWORD=animecream123

# Crear directorio para scripts de inicialización
RUN mkdir -p /docker-entrypoint-initdb.d

# Copiar scripts SQL de todos los módulos
COPY sql/ /docker-entrypoint-initdb.d/

# Configurar puerto
EXPOSE 3306

# Comando por defecto
CMD ["mysqld"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mariadb:
    build: .
    container_name: animecream-mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_USER: ${MYSQL_USER:-animecream}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-animecream123}
    ports:
      - '${MARIADB_PORT:-3306}:3306'
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./sql:/docker-entrypoint-initdb.d
      - ../animecream-data/sql:/docker-entrypoint-initdb.d/animecream
      - ../auth-data/sql:/docker-entrypoint-initdb.d/auth
      - ./logs:/var/log/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --sql-mode="STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO"
    networks:
      - animecream-network

volumes:
  mariadb_data:
    driver: local

networks:
  animecream-network:
    driver: bridge
```

## 🛠️ Comandos Útiles

### Gestión de Contenedores

```bash
# Iniciar contenedores
docker-compose up -d

# Detener contenedores
docker-compose down

# Reconstruir contenedores
docker-compose up -d --build

# Ver logs
docker-compose logs -f mariadb

# Ver estado de contenedores
docker-compose ps
```

### Gestión de Base de Datos

```bash
# Acceder a la base de datos
docker exec -it animecream-mariadb mysql -u root -p

# Acceder con usuario específico
docker exec -it animecream-mariadb mysql -u animecream -p

# Ejecutar comando SQL específico
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# Backup de base de datos
docker exec animecream-mariadb mysqldump -u root -p animecre_auth > backup_auth.sql

# Restore de base de datos
docker exec -i animecream-mariadb mysql -u root -p animecre_auth < backup_auth.sql
```

### Gestión de Volúmenes

```bash
# Ver volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect docker_mariadb_data

# Limpiar volúmenes (CUIDADO: Borra datos)
docker-compose down -v

# Backup de volúmenes
docker run --rm -v docker_mariadb_data:/data -v $(pwd):/backup alpine tar czf /backup/mariadb_backup.tar.gz -C /data .
```

## 🔍 Verificación y Testing

### Scripts de Verificación

```bash
# Verificar que las bases de datos se crearon
./scripts/verify-modules.sh

# Verificar variables de entorno
./scripts/check-env.sh

# Verificar conexión
docker exec -it animecream-mariadb mysql -u root -p -e "SELECT 1;"
```

### Verificación Manual

```bash
# 1. Verificar contenedores
docker ps

# 2. Verificar bases de datos
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# 3. Verificar tablas en cada base de datos
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; SHOW TABLES;"
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_finan; SHOW TABLES;"
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_series; SHOW TABLES;"

# 4. Verificar conectividad desde el host
mysql -h localhost -P 3306 -u animecream -p
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Docker Desktop no ejecutándose

```bash
# Síntomas
docker: command not found
# o
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.47/containers/json?all=1&filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.project%3Ddocker%22%3Atrue%7D%7D": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.

# Solución
# Iniciar Docker Desktop desde el menú de inicio
# Esperar a que aparezca el ícono de Docker en la bandeja del sistema
```

#### Puerto ya en uso

```bash
# Síntomas
Error: listen EADDRINUSE: address already in use :::3306

# Solución
# Cambiar puerto en docker-compose.yml
ports:
  - "3307:3306"  # Cambiar 3307 por otro puerto disponible
```

#### Contenedor no inicia

```bash
# Síntomas
docker-compose up -d
# No hay output o error

# Solución
# Ver logs para identificar el problema
docker-compose logs mariadb

# Reconstruir contenedor
docker-compose down
docker-compose up -d --build
```

#### Base de datos no accesible

```bash
# Síntomas
Error: connect ECONNREFUSED 127.0.0.1:3306

# Solución
# Verificar que el contenedor esté ejecutándose
docker ps

# Verificar logs
docker-compose logs mariadb

# Reiniciar contenedor
docker-compose restart mariadb
```

### Comandos de Diagnóstico

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs detallados
docker-compose logs --tail=100 mariadb

# Ver uso de recursos
docker stats animecream-mariadb

# Ver información del contenedor
docker inspect animecream-mariadb

# Ver procesos dentro del contenedor
docker exec -it animecream-mariadb ps aux
```

## 📊 Monitoreo y Métricas

### Métricas de Contenedor

```bash
# Uso de CPU y memoria
docker stats animecream-mariadb

# Información detallada
docker inspect animecream-mariadb

# Logs en tiempo real
docker-compose logs -f mariadb
```

### Métricas de Base de Datos

```sql
-- Ver estado de la base de datos
SHOW STATUS;

-- Ver variables de configuración
SHOW VARIABLES;

-- Ver procesos activos
SHOW PROCESSLIST;

-- Ver información de tablas
SELECT
    table_schema,
    table_name,
    table_rows,
    data_length,
    index_length
FROM information_schema.tables
WHERE table_schema LIKE 'animecre_%';
```

## 🚀 Optimización

### Configuración de Rendimiento

```yaml
# docker-compose.yml - Configuración optimizada
services:
  mariadb:
    # ... configuración existente ...
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --sql-mode="STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO"
      --innodb-buffer-pool-size=256M
      --max-connections=100
      --query-cache-size=32M
      --query-cache-type=1
```

### Configuración de Recursos

```yaml
# docker-compose.yml - Límites de recursos
services:
  mariadb:
    # ... configuración existente ...
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

## 📝 Notas Importantes

### Persistencia de Datos

- Los datos se almacenan en volúmenes Docker
- Los volúmenes persisten entre reinicios del contenedor
- Para backup/restore, usar los comandos de volúmenes

### Seguridad

- Cambiar contraseñas por defecto en producción
- Usar variables de entorno para configuración sensible
- Configurar firewall para limitar acceso a la base de datos

### Escalabilidad

- Para producción, considerar cluster de MariaDB
- Implementar replicación para alta disponibilidad
- Usar load balancer para múltiples instancias

---

**Última actualización**: 2024-09-28

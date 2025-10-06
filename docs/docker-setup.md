# Docker Setup - Module-API

## 🐳 Docker Configuration

This document describes the Docker configuration for the Module-API project, including MariaDB and all module databases.

## 📋 Requirements

### Required Software

- **Docker Desktop**: For Windows
- **Docker Compose**: Included in Docker Desktop
- **Git**: To clone the repository

### Minimum Hardware

- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB free space
- **CPU**: 2 cores minimum

## 🚀 Quick Start

### 1. Verify Docker Desktop

```bash
# Verify Docker is installed
docker --version

# Verify Docker Desktop is running
docker ps

# If it doesn't work, start Docker Desktop from the start menu
```

### 2. Configure Node.js

```bash
# Configure Node.js (latest LTS version)
# Download from https://nodejs.org/

# Verify version
node --version
```

### 3. Run Containers

```bash
# Navigate to docker directory
cd docker

# Build and run containers
docker-compose up -d --build

# View logs
docker-compose logs -f mariadb

# Verify it's working
docker ps
```

## 🏗️ Docker Architecture

### Container Structure

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

### Network Configuration

```yaml
# docker-compose.yml
networks:
  animecream-network:
    driver: bridge
```

## 📊 Databases

### Created Databases

| Database           | Module   | Description              |
| ------------------ | -------- | ------------------------ |
| `animecre_auth`    | @auth/   | Authentication and users |
| `animecre_cake514` | main     | Main database            |
| `animecre_finan`   | @finan/  | Financial module         |
| `animecre_series`  | @series/ | Series module            |

### SQL Initialization Scripts

```
sql/
├── 00-create-module-databases.sql    # Create all databases
├── 01-setup-auth-module.sql          # Configure authentication module
├── 02-setup-main-database.sql        # Configure main database
├── 03-setup-finan-module.sql         # Configure financial module
├── 04-setup-series-module.sql        # Configure series module
└── 99-verify-databases.sql           # Verify that everything was created correctly
```

## 🔧 Detailed Configuration

### Dockerfile

```dockerfile
# Dockerfile para MariaDB 10.3.39
FROM mariadb:10.3.39

# Configure default environment variables
ENV MYSQL_ROOT_PASSWORD=root
ENV MYSQL_USER=animecream
ENV MYSQL_PASSWORD=animecream123

# Create directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Copy SQL scripts from all modules
COPY sql/ /docker-entrypoint-initdb.d/

# Configure port
EXPOSE 3306

# Default command
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

## 🛠️ Useful Commands

### Container Management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Rebuild containers
docker-compose up -d --build

# View logs
docker-compose logs -f mariadb

# View container status
docker-compose ps
```

### Database Management

```bash
# Access the database
docker exec -it animecream-mariadb mysql -u root -p

# Access with specific user
docker exec -it animecream-mariadb mysql -u animecream -p

# Execute specific SQL command
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# Database backup
docker exec animecream-mariadb mysqldump -u root -p animecre_auth > backup_auth.sql

# Database restore
docker exec -i animecream-mariadb mysql -u root -p animecre_auth < backup_auth.sql
```

### Volume Management

```bash
# View volumes
docker volume ls

# Inspect volume
docker volume inspect docker_mariadb_data

# Clean volumes (WARNING: Deletes data)
docker-compose down -v

# Volume backup
docker run --rm -v docker_mariadb_data:/data -v $(pwd):/backup alpine tar czf /backup/mariadb_backup.tar.gz -C /data .
```

## 🔍 Verification and Testing

### Verification Scripts

```bash
# Verify that databases were created
./scripts/verify-modules.sh

# Verify environment variables
./scripts/check-env.sh

# Verify connection
docker exec -it animecream-mariadb mysql -u root -p -e "SELECT 1;"
```

### Manual Verification

```bash
# 1. Verify containers
docker ps

# 2. Verify databases
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# 3. Verify tables in each database
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; SHOW TABLES;"
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_finan; SHOW TABLES;"
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_series; SHOW TABLES;"

# 4. Verify connectivity from host
mysql -h localhost -P 3306 -u animecream -p
```

## 🐛 Troubleshooting

### Common Problems

#### Docker Desktop not running

```bash
# Symptoms
docker: command not found
# or
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.47/containers/json?all=1&filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.project%3Ddocker%22%3Atrue%7D%7D": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.

# Solution
# Start Docker Desktop from the start menu
# Wait for the Docker icon to appear in the system tray
```

#### Port already in use

```bash
# Symptoms
Error: listen EADDRINUSE: address already in use :::3306

# Solution
# Change port in docker-compose.yml
ports:
  - "3307:3306"  # Change 3307 to another available port
```

#### Container does not start

```bash
# Symptoms
docker-compose up -d
# No output or error

# Solution
# View logs to identify the problem
docker-compose logs mariadb

# Rebuild container
docker-compose down
docker-compose up -d --build
```

#### Database not accessible

```bash
# Symptoms
Error: connect ECONNREFUSED 127.0.0.1:3306

# Solution
# Verify that the container is running
docker ps

# Check logs
docker-compose logs mariadb

# Restart container
docker-compose restart mariadb
```

### Diagnostic Commands

```bash
# View container status
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 mariadb

# View resource usage
docker stats animecream-mariadb

# View container information
docker inspect animecream-mariadb

# View processes inside container
docker exec -it animecream-mariadb ps aux
```

## 📊 Monitoring and Metrics

### Container Metrics

```bash
# CPU and memory usage
docker stats animecream-mariadb

# Detailed information
docker inspect animecream-mariadb

# Real-time logs
docker-compose logs -f mariadb
```

### Database Metrics

```sql
-- View database status
SHOW STATUS;

-- View configuration variables
SHOW VARIABLES;

-- View active processes
SHOW PROCESSLIST;

-- View table information
SELECT
    table_schema,
    table_name,
    table_rows,
    data_length,
    index_length
FROM information_schema.tables
WHERE table_schema LIKE 'animecre_%';
```

## 🚀 Optimization

### Performance Configuration

```yaml
# docker-compose.yml - Optimized configuration
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

### Resource Configuration

```yaml
# docker-compose.yml - Resource limits
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

## 📝 Important Notes

### Data Persistence

- Data is stored in Docker volumes
- Volumes persist between container restarts
- For backup/restore, use volume commands

### Security

- Change default passwords in production
- Use environment variables for sensitive configuration
- Configure firewall to limit database access

### Scalability

- For production, consider MariaDB cluster
- Implement replication for high availability
- Use load balancer for multiple instances

---

**Last updated**: 2025-10-05

# Despliegue - Module-API

## 🚀 Estrategias de Despliegue

Este documento describe las diferentes estrategias de despliegue para el proyecto Module-API, desde desarrollo local hasta producción en la nube.

## 📋 Requisitos del Sistema

### Desarrollo

- **Node.js**: 12.22.9
- **Docker**: Docker Desktop
- **RAM**: 4GB mínimo
- **Disco**: 2GB libre

### Producción

- **Node.js**: 12.22.9
- **Docker**: Docker Engine
- **RAM**: 8GB mínimo, 16GB recomendado
- **Disco**: 10GB libre
- **CPU**: 4 cores mínimo

## 🏠 Despliegue Local

### Configuración de Desarrollo

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd module-api

# 2. Configurar Node.js
nvm use 12.22.9

# 3. Instalar dependencias
npm install

# 4. Configurar Docker
cd docker
docker-compose up -d --build

# 5. Iniciar servidor
npm run dev
```

### Variables de Entorno de Desarrollo

```env
# .env.development
NODE_ENV=development
PORT=3001

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# JWT
JWT_SECRET=development-secret-key
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug
```

## 🐳 Despliegue con Docker

### Dockerfile para Producción

```dockerfile
# Dockerfile
FROM node:12.22.9-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambiar propietario de archivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]
```

### Docker Compose para Producción

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    container_name: module-api-app
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: mariadb
      DB_PORT: 3306
      DB_USER: animecream
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - '3001:3001'
    depends_on:
      - mariadb
    networks:
      - app-network

  mariadb:
    image: mariadb:10.3.39
    container_name: module-api-mariadb
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_USER: animecream
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./docker/sql:/docker-entrypoint-initdb.d
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: module-api-nginx
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - app-network

volumes:
  mariadb_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

## ☁️ Despliegue en la Nube

### AWS EC2

#### Configuración de Instancia

```bash
# Instalar Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 12.22.9
nvm use 12.22.9

# Instalar Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Configuración de Seguridad

```bash
# Configurar firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Configurar SSL
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

### Google Cloud Platform

#### Configuración de Compute Engine

```bash
# Crear instancia
gcloud compute instances create module-api \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --zone=us-central1-a

# Configurar firewall
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0
```

### Azure

#### Configuración de Virtual Machine

```bash
# Crear grupo de recursos
az group create --name module-api-rg --location eastus

# Crear máquina virtual
az vm create \
  --resource-group module-api-rg \
  --name module-api-vm \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

## 🔧 Configuración de Producción

### Variables de Entorno de Producción

```env
# .env.production
NODE_ENV=production
PORT=3001

# Base de datos
DB_HOST=production-db-host
DB_PORT=3306
DB_USER=production-user
DB_PASSWORD=secure-production-password

# JWT
JWT_SECRET=super-secure-production-secret-key
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=warn

# SSL
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Configuración de Nginx

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3001;
    }

    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api-docs {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📊 Monitoreo y Logging

### Configuración de Logging

```typescript
// logging.config.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export default logger;
```

### Configuración de PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'module-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

## 🔒 Seguridad en Producción

### Configuración de Seguridad

```bash
# Configurar firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Configurar fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Configuración de SSL

```bash
# Generar certificado SSL
sudo certbot --nginx -d yourdomain.com

# Renovar certificado automáticamente
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📈 Escalabilidad

### Load Balancing

```nginx
# nginx.conf con load balancing
upstream app {
    server app1:3001;
    server app2:3001;
    server app3:3001;
}

server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Auto Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  app:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    environment:
      NODE_ENV: production
      PORT: 3001
    networks:
      - app-network
```

## 🧪 Testing de Despliegue

### Scripts de Testing

```bash
#!/bin/bash
# test-deployment.sh

# Verificar que el servidor responde
curl -f http://localhost:3001/health || exit 1

# Verificar que la API responde
curl -f http://localhost:3001/api || exit 1

# Verificar que Swagger responde
curl -f http://localhost:3001/api-docs || exit 1

# Verificar que la base de datos está conectada
curl -f http://localhost:3001/health | grep -q "database.*ok" || exit 1

echo "Deployment test passed!"
```

### Health Checks

```typescript
// health-check.ts
export const healthCheck = async (): Promise<HealthStatus> => {
  const status: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',
      api: 'ok',
    },
  };

  try {
    // Verificar conexión a base de datos
    await database.testConnection();
  } catch (error) {
    status.services.database = 'error';
    status.status = 'error';
  }

  return status;
};
```

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '12.22.9'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build

      - name: Deploy to server
        run: |
          ssh user@server 'cd /path/to/app && git pull && docker-compose up -d --build'
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm test

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - ssh user@server 'cd /path/to/app && git pull && docker-compose up -d --build'
  only:
    - main
```

## 📊 Métricas de Producción

### Métricas de Rendimiento

- **Response Time**: < 200ms promedio
- **Throughput**: 1000 requests/min
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%

### Métricas de Recursos

- **CPU Usage**: < 70%
- **Memory Usage**: < 80%
- **Disk Usage**: < 85%
- **Network Usage**: Monitoreo de ancho de banda

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Puerto ya en uso"

```bash
# Verificar procesos usando el puerto
sudo lsof -i :3001

# Matar proceso si es necesario
sudo kill -9 <PID>
```

#### Error: "Base de datos no accesible"

```bash
# Verificar estado de Docker
docker-compose ps

# Ver logs de base de datos
docker-compose logs mariadb

# Reiniciar servicios
docker-compose restart
```

#### Error: "Memoria insuficiente"

```bash
# Verificar uso de memoria
free -h

# Limpiar caché
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Aumentar swap si es necesario
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Comandos de Diagnóstico

```bash
# Verificar estado del sistema
systemctl status nginx
systemctl status docker

# Verificar logs
journalctl -u nginx -f
journalctl -u docker -f

# Verificar recursos
htop
df -h
free -h
```

---

**Última actualización**: 2024-09-28

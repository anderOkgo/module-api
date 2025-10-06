# Deployment - Module-API

## 🚀 Deployment Strategies

This document describes different deployment strategies for the Module-API project, from local development to cloud production.

## 📋 System Requirements

### Development

- **Node.js**: Latest LTS version
- **Docker**: Docker Desktop
- **RAM**: 4GB minimum
- **Disk**: 2GB free

### Production

- **Node.js**: Latest LTS version
- **Docker**: Docker Engine
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 10GB free
- **CPU**: 4 cores minimum

## 🏠 Local Deployment

### Development Configuration

```bash
# 1. Clone repository
git clone <repository-url>
cd module-api

# 2. Install dependencies
npm install

# 3. Configure Docker
cd docker
docker-compose up -d --build

# 4. Start server
npm run dev
```

### Development Environment Variables

```env
# .env.development
NODE_ENV=development
PORT=3001

# Database
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

## 🐳 Docker Deployment

### Production Dockerfile

```dockerfile
# Dockerfile
FROM node:latest-alpine

# Create working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change file ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]
```

### Production Docker Compose

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

## ☁️ Cloud Deployment

### AWS EC2

#### Instance Configuration

```bash
# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Security Configuration

```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Configure SSL
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

### Google Cloud Platform

#### Compute Engine Configuration

```bash
# Create instance
gcloud compute instances create module-api \
  --image-family=ubuntu-2004-lts \
  --image-project=ubuntu-os-cloud \
  --machine-type=e2-medium \
  --zone=us-central1-a

# Configure firewall
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0
```

### Azure

#### Virtual Machine Configuration

```bash
# Create resource group
az group create --name module-api-rg --location eastus

# Create virtual machine
az vm create \
  --resource-group module-api-rg \
  --name module-api-vm \
  --image UbuntuLTS \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

## 🔧 Production Configuration

### Folder and Symlink Configuration in cPanel

#### Real Folder and Symlink Configuration

**Real folder (where files are physically stored):**

```
/home/animecre/public_html/webroot/img/tarjeta
```

**Mirror folder (symlink, alias pointing to the real one):**

```
/home/animecre/info.animecream.com/uploads/series/img/tarjeta
```

#### Steps Performed

1. **Backup of the previous folder in uploads (for safety):**

```bash
mv /home/animecre/info.animecream.com/uploads/series/img/tarjeta /home/animecre/info.animecream.com/uploads/series/img/tarjeta_backup
```

2. **Symlink creation:**

```bash
ln -s /home/animecre/public_html/webroot/img/tarjeta /home/animecre/info.animecream.com/uploads/series/img/tarjeta
```

3. **Verification:**

```bash
ls -l /home/animecre/info.animecream.com/uploads/series/img | grep tarjeta
```

Should show something like:

```
tarjeta -> /home/animecre/public_html/webroot/img/tarjeta
```

#### Result

- All files are actually stored in:
  `/home/animecre/public_html/webroot/img/tarjeta`

- Accessing or saving to the `uploads/.../tarjeta` path will also use the real folder thanks to the symlink.

This way you can work from both paths interchangeably, but without duplicating files.

#### Code Configuration

For the application to use the correct path in production, make sure the upload configuration is set to use the symlink path:

```typescript
// En series.service.ts
private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta');
```

This will allow the application to save files in the symlink path, which will automatically store them in the real folder.

### Production Environment Variables

```env
# .env.production
NODE_ENV=production
PORT=3001

# Database
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

### Nginx Configuration

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

## 📊 Monitoring and Logging

### Logging Configuration

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

### PM2 Configuration

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

## 🔒 Production Security

### Security Configuration

```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Configure fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### SSL Configuration

```bash
# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com

# Automatically renew certificate
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📈 Scalability

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

## 🧪 Deployment Testing

### Testing Scripts

```bash
#!/bin/bash
# test-deployment.sh

# Verify that the server responds
curl -f http://localhost:3001/health || exit 1

# Verify that the API responds
curl -f http://localhost:3001/api || exit 1

# Verify that Swagger responds
curl -f http://localhost:3001/api-docs || exit 1

# Verify that the database is connected
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
    // Verify database connection
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
          node-version: '18'

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

## 📊 Production Metrics

### Performance Metrics

- **Response Time**: < 200ms promedio
- **Throughput**: 1000 requests/min
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%

### Resource Metrics

- **CPU Usage**: < 70%
- **Memory Usage**: < 80%
- **Disk Usage**: < 85%
- **Network Usage**: Bandwidth monitoring

## 🐛 Troubleshooting

### Common Problems

#### Error: "Port already in use"

```bash
# Check processes using the port
sudo lsof -i :3001

# Kill process if necessary
sudo kill -9 <PID>
```

#### Error: "Database not accessible"

```bash
# Check Docker status
docker-compose ps

# View database logs
docker-compose logs mariadb

# Restart services
docker-compose restart
```

#### Error: "Insufficient memory"

```bash
# Check memory usage
free -h

# Clear cache
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Increase swap if necessary
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Diagnostic Commands

```bash
# Check system status
systemctl status nginx
systemctl status docker

# Check logs
journalctl -u nginx -f
journalctl -u docker -f

# Check resources
htop
df -h
free -h
```

---

**Last updated**: 2025-10-05

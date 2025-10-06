# Project Configuration

## 📋 System Requirements

### Required Software

- **Node.js**: Latest LTS version
- **Docker Desktop**: For containers
- **Git**: Version control
- **MySQL Client**: For database administration (optional)

### Minimum Hardware

- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB free space
- **CPU**: 2 cores minimum

## 🚀 Step-by-Step Installation

### 1. Configure Node.js

```bash
# Install Node.js (latest LTS version)
# Download from https://nodejs.org/

# Verify installation
node --version
npm --version
```

### 2. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd module-api

# Verify you are on the correct branch
git branch
```

### 3. Install Dependencies

```bash
# Install project dependencies
npm install

# Verify there are no errors
npm run build
```

### 4. Configure Docker

```bash
# Navigate to docker directory
cd docker

# Verify Docker Desktop is running
docker --version
docker ps

# Build and run containers
docker-compose up -d --build

# Verify containers are running
docker ps
```

### 5. Configure Environment Variables

```bash
# Create .env file in project root
cp .env.example .env

# Edit variables according to your environment
nano .env
```

### 6. Initialize Database

```bash
# SQL scripts run automatically
# Verify that databases were created
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"
```

## 🔧 Development Configuration

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
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

### Development Scripts

```bash
# Start in development mode
npm run dev

# Start with hot reload
npm run dev:watch

# Run tests
npm test

# Tests with coverage
npm run test:cov

# Linting
npm run lint

# Code formatting
npm run format
```

## 🐳 Docker Configuration

### Container Structure

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

### Useful Docker Commands

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f mariadb

# Stop containers
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Access container
docker exec -it animecream-mariadb mysql -u root -p

# Clean volumes (WARNING: Deletes data)
docker-compose down -v
```

## 🗄️ Database Configuration

### Created Databases

- **animecre_auth**: Authentication and users
- **animecre_cake514**: Main database
- **animecre_finan**: Finance module
- **animecre_series**: Series module

### Backend Connection

```typescript
// Connection configuration
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

## 🔐 Security Configuration

### JWT Configuration

```typescript
// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  algorithm: 'HS256',
};
```

### Password Hashing

```typescript
// bcrypt configuration
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

## 📊 Logging Configuration

### Winston Configuration

```typescript
// Logging configuration
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

## 🧪 Testing Configuration

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
# Configure testing database
# Tests use a separate database
DB_TEST_NAME=animecre_test
```

## 🚀 Production Configuration

### Production Environment Variables

```env
# Production
NODE_ENV=production
PORT=3001

# Production database
DB_HOST=production-db-host
DB_PORT=3306
DB_USER=production-user
DB_PASSWORD=production-password

# Production JWT
JWT_SECRET=super-secure-production-secret

# Production logging
LOG_LEVEL=warn
```

### Production Optimizations

```bash
# Build for production
npm run build

# Start in production
npm start

# PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name "module-api"
```

## 🔍 Installation Verification

### Verification Checklist

- [ ] Node.js (latest LTS version) installed and configured
- [ ] Docker Desktop running
- [ ] Database containers running
- [ ] Environment variables configured
- [ ] Dependencies installed without errors
- [ ] Server starting correctly
- [ ] Database accessible
- [ ] API responding at http://localhost:3001

### Verification Commands

```bash
# Verify Node.js
node --version

# Verify Docker
docker --version
docker ps

# Verify database
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# Verify server
curl http://localhost:3001/health

# Verify API
curl http://localhost:3001/api
```

## 🐛 Common Issues Troubleshooting

### Error: Incorrect Node.js version

```bash
# Solution
# Use latest LTS version from https://nodejs.org/
node --version
```

### Error: Docker not running

```bash
# Solution
# Start Docker Desktop from the start menu
```

### Error: Port already in use

```bash
# Solution
# Change port in .env or docker-compose.yml
```

### Error: Database not accessible

```bash
# Solution
docker-compose down
docker-compose up -d --build
```

---

**Last updated**: 2025-10-05

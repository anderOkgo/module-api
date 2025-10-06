# Module-API

Modular API built with **Hexagonal Architecture**, **Clean Architecture** and **SOLID** principles. Backend project for the Animecream ecosystem with specialized modules for authentication, finance, and series management.

## 🏗️ Architecture

### Architectural Principles

- **Hexagonal Architecture (Ports & Adapters)**: Decoupling domain from external dependencies
- **Clean Architecture**: Clear separation between layers (Domain, Application, Infrastructure)
- **SOLID Principles**: Maintainable and extensible code
- **Factory Pattern**: Clean and testable dependency injection

### Project Structure

```
src/
├── infrastructure/          # Global infrastructure layer
│   ├── lib/                # Core implementations
│   ├── data/               # Database connections
│   └── routes/             # Global routes
├── modules/                 # Specialized modules
│   ├── auth/               # Authentication module
│   ├── finan/              # Finance module
│   └── series/             # Series module
└── docs/                   # Complete documentation
```

## 🚀 Technologies

### Backend

- **Node.js**: Latest LTS version
- **TypeScript**: Latest stable version
- **Express**: Web framework
- **MySQL/MariaDB**: Database (Docker)
- **Sharp**: Image processing
- **JWT**: Authentication
- **Swagger**: API documentation

### Database

- **MariaDB**: Latest version (Docker)
- **Multiple databases**:
  - `animecre_auth`: Authentication
  - `animecre_cake514`: Main database
  - `animecre_finan`: Finance
  - `animecre_series`: Series

## 📦 Modules

### 🔐 Auth Module (`@auth/`)

- **User registration** with robust validations
- **Login** with email or username
- **Security**: account locking, login attempts
- **JWT**: Authentication tokens

### 💰 Finan Module (`@finan/`)

- **Complete financial management**
- **Stored procedures** for complex calculations
- **Reports** of expenses and balances
- **Authentication** required for operations

### 📺 Series Module (`@series/`)

- **Complete CRUD** for series
- **Optimized image uploads** (190x285px, ~20KB)
- **Advanced search** with filters
- **Authentication** for write operations

## 🐳 Docker Setup

### Requirements

- **Docker Desktop** running
- **Node.js** (latest LTS version)

### Quick Start

```bash
# 1. Navigate to docker directory
cd docker

# 2. Run container
docker-compose up -d --build

# 3. Verify it's working
docker ps
```

### Database Access

- **Host**: localhost
- **Port**: 3306
- **Root user**: root / **Password**: root
- **User**: animecream / **Password**: animecream123

## 🛠️ Development

### Installation

```bash
# Clone repository
git clone <repository-url>
cd module-api

# Install dependencies
npm install
```

### Available Scripts

```bash
# Development (compilation + server)
npm run servers

# Compilation only
npx tsc

# Run server
node dist/index.js
```

### Main Endpoints

- **`GET /`**: Basic API status
- **`GET /health`**: Detailed status with database verification
- **`GET /api-docs`**: Swagger documentation
- **`POST /api/users/login`**: Authentication
- **`POST /api/series/create`**: Create series (with image)

## 📚 Documentation

### Complete Documentation

- **`docs/README.md`**: General index
- **`docs/architecture.md`**: Detailed architecture
- **`docs/setup.md`**: Project configuration
- **`docs/docker-setup.md`**: Docker configuration
- **`docs/modules/`**: Module documentation

### Documented Modules

- **`docs/modules/auth.md`**: Authentication module
- **`docs/modules/finan.md`**: Finance module
- **`docs/modules/series.md`**: Series module

## 🔧 Configuration

### Environment Variables

The project uses default values from `docker-compose.yml`:

- **MYSQL_ROOT_PASSWORD**: root
- **MYSQL_USER**: animecream
- **MYSQL_PASSWORD**: animecream123
- **MARIADB_PORT**: 3306

### Compatibility

- **Node.js**: Latest LTS version
- **TypeScript**: Latest stable version
- **Sharp**: Latest stable version

## 🚨 Troubleshooting

### Common Issues

1. **Node.js compatibility error**: Use latest LTS version
2. **Sharp doesn't work**: Verify latest stable version
3. **Docker doesn't start**: Verify Docker Desktop is running
4. **Database doesn't connect**: Verify credentials and port

### Diagnostic Commands

```bash
# Verify Node.js version
node --version

# Verify Docker containers
docker ps

# Verify database connection
curl http://localhost:3001/health
```

## 📄 License

This project is licensed under the **MIT License**.

## 🤝 Contributing

Contributions are welcome. To contribute:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For technical support or questions:

- Review the documentation in `docs/`
- Check the troubleshooting section
- Create an issue in the repository

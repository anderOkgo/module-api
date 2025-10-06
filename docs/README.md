# Module-API - Complete Documentation

## 📋 Index

- [🏠 Home](README.md)
- [📦 General Architecture](architecture.md)
- [🔧 Project Configuration](setup.md)
- [🐳 Docker Setup](docker-setup.md)
- [🔐 Authentication Module (@auth/)](modules/auth.md)
- [💰 Finance Module (@finan/)](modules/finan.md)
- [📺 Series Module (@series/)](modules/series.md)
- [🗄️ Databases](databases.md)
- [🚀 Deployment](deployment.md)
- [🐛 Troubleshooting](troubleshooting.md)
- [📮 Postman Collection](postman/README.md)

## 📁 File Configuration in Production

### Symlinks in cPanel

The project uses symlinks to manage image files in production:

- **Real folder**: `/home/animecre/public_html/webroot/img/tarjeta`
- **Mirror folder**: `/home/animecre/info.animecream.com/uploads/series/img/tarjeta`

This configuration allows files to be stored physically in the web accessible folder, but the application saves them using the standard upload path. See [Deployment](deployment.md#folder-configuration-and-symlinks-in-cpanel) for more details.

## 📮 Postman Collection

### Organized Structure

All Postman files are organized in `docs/postman/`:

- **`docs/postman/Animecream-API.postman_collection.json`** - Complete collection with all endpoints
- **`docs/postman/Animecream-Local.postman_environment.json`** - Local environment (`http://localhost:3001`)
- **`docs/postman/Animecream-Production.postman_environment.json`** - Production environment (`https://info.animecream.com`)
- **`docs/postman/Animecream-Environments.postman_environment.json`** - Base environment
- **`docs/postman/README.md`** - Complete usage guide

### Quick Usage

1. Import the `.json` files from `docs/postman/` in Postman
2. Select the desired environment (Local/Production)
3. Configure authentication variables
4. Ready to use!

See [Postman Collection](postman/README.md) for complete documentation.

## 🎯 General Description

**Module-API** is a Node.js backend project that implements a modular architecture for anime and series management. The project uses Clean Architecture and Hexagonal Architecture to maintain clean, maintainable and scalable code.

## 🏗️ Project Architecture

```
module-api/
├── src/
│   ├── modules/           # Application modules
│   │   ├── auth/          # Authentication and users
│   │   ├── finan/         # Financial management
│   │   └── series/        # Series/anime management
│   ├── infrastructure/    # Infrastructure layer
│   └── server.ts         # Entry point
├── docker/               # Docker configuration
├── docs/                 # Documentation
└── package.json
```

## 🛠️ Technologies Used

### Backend

- **Node.js**: Latest LTS version
- **TypeScript**: For static typing
- **Express.js**: Web framework
- **JWT**: Authentication
- **bcrypt**: Password encryption

### Database

- **MariaDB**: Latest version (Docker container)
- **MySQL**: Compatible with MariaDB

### Infrastructure

- **Docker**: Containers
- **Docker Compose**: Orchestration
- **Sharp**: Image processing
- **Multer**: File uploads

### Development

- **Swagger**: API documentation
- **Jest**: Testing
- **ESLint**: Linting
- **Prettier**: Code formatting

## 🚀 Quick Start

### Prerequisites

- Node.js (latest LTS version)
- Docker Desktop
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd module-api

# Install dependencies
npm install

# Configure Docker
cd docker
docker-compose up -d --build

# Start the server
npm run dev
```

## 📊 System Modules

### 🔐 @auth/ - Authentication

- User registration
- JWT login
- Session management
- Security validations

### 💰 @finan/ - Finance

- Movement management
- Expense categories
- Financial reports
- Expense analysis

### 📺 @series/ - Series

- Series/anime CRUD
- Image management
- Genre categorization
- Search and filtering

## 🗄️ Databases

The system uses multiple databases organized by module:

- **animecre_auth**: Authentication and users
- **animecre_cake514**: Main database
- **animecre_finan**: Finance module
- **animecre_series**: Series module

## 🔧 Configuration

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3001
NODE_ENV=development
```

### Docker

```bash
# Start containers
cd docker
docker-compose up -d

# View logs
docker-compose logs -f mariadb
```

## 📚 API Documentation

The API documentation is available in Swagger:

- **URL**: http://localhost:3001/api-docs
- **Authentication**: Bearer Token (JWT)

## 🧪 Testing

```bash
# Run tests
npm test

# Tests with coverage
npm run test:cov

# Tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## 📝 Contributing

1. Fork the project
2. Create a branch for the feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Main Developer**: [Your Name]
- **Email**: [your-email@example.com]

## 📞 Support

For support, please contact:

- **Email**: [support@example.com]
- **Issues**: [GitHub Issues](https://github.com/your-username/module-api/issues)

---

**Last updated**: 2025-10-05
**Version**: 2.0.9

# Módulo de Autenticación (@auth/)

## 🔐 Descripción General

El módulo de autenticación (`@auth/`) maneja todo lo relacionado con usuarios, autenticación, autorización y seguridad del sistema. Implementa un sistema robusto de autenticación con JWT, gestión de sesiones y medidas de seguridad avanzadas.

## 🏗️ Arquitectura del Módulo

```
src/modules/auth/
├── application/
│   ├── use-cases/           # Casos de uso
│   │   ├── register-user.use-case.ts
│   │   └── login-user.use-case.ts
│   └── validators/          # Validadores de aplicación
│       └── user-request.validator.ts
├── domain/
│   ├── models/             # Modelos de dominio
│   │   ├── User.ts
│   │   └── Login.ts
│   ├── services/           # Servicios de dominio
│   │   ├── auth.service.ts
│   │   └── auth.factory.ts
│   └── validators/          # Validadores de dominio
│       ├── user.validator.ts
│       └── password.validator.ts
└── infrastructure/
    ├── controllers/        # Controladores
    │   └── user.controller.ts
    ├── routes/            # Rutas
    │   └── user.routes.ts
    ├── repositories/      # Interfaces de repositorio
    │   └── user.repository.ts
    └── user.mysql.ts      # Implementación MySQL
```

## 📊 Modelos de Datos

### User Model

```typescript
interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  created: Date;
  modified: Date;
  last_login?: Date;
  login_attempts: number;
  locked_until?: Date;
}

enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
```

### Login Model

```typescript
interface Login {
  username?: string;
  email?: string;
  password: string;
}
```

## 🔧 Funcionalidades

### 1. Registro de Usuarios

**Endpoint**: `POST /api/users/add`

**Funcionalidades**:

- Validación de datos de entrada
- Verificación de unicidad de email/username
- Hash de contraseña con bcrypt
- Creación de usuario en base de datos
- Generación de token JWT

**Validaciones**:

- Email válido y único
- Username único
- Contraseña segura (mínimo 8 caracteres, mayúsculas, minúsculas, números, símbolos)
- Nombres requeridos

### 2. Autenticación de Usuarios

**Endpoint**: `POST /api/users/login`

**Funcionalidades**:

- Login con email o username
- Validación de credenciales
- Control de intentos fallidos
- Bloqueo de cuenta por intentos excesivos
- Actualización de último login
- Generación de token JWT

**Medidas de Seguridad**:

- Límite de intentos de login (5 intentos)
- Bloqueo temporal de cuenta (30 minutos)
- Hash de contraseñas con salt
- Tokens JWT con expiración

### 3. Gestión de Sesiones

**Funcionalidades**:

- Tokens JWT con expiración configurable
- Refresh tokens (futuro)
- Invalidación de sesiones
- Logout seguro

## 🛡️ Seguridad

### Validaciones de Contraseña

```typescript
class PasswordValidator {
  static validate(password: string): ValidationResult {
    // Mínimo 8 caracteres
    // Máximo 128 caracteres
    // Al menos una mayúscula
    // Al menos una minúscula
    // Al menos un número
    // Al menos un símbolo
    // No debe ser contraseña común
  }
}
```

### Control de Acceso

```typescript
// Middleware de autenticación
export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  // Validar token JWT
  // Verificar expiración
  // Verificar usuario activo
  // Verificar cuenta no bloqueada
};
```

### Medidas de Seguridad

- **Rate Limiting**: Límite de intentos de login
- **Account Lockout**: Bloqueo temporal por intentos fallidos
- **Password Hashing**: bcrypt con salt rounds
- **JWT Security**: Tokens firmados y con expiración
- **Input Validation**: Validación en múltiples capas

## 🗄️ Base de Datos

### Tabla: users

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  login_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL
);
```

### Tabla: email_verification

```sql
CREATE TABLE email_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  verification_code INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Índices

```sql
-- Índices para optimización
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_locked_until ON users(locked_until);
CREATE INDEX idx_users_last_login ON users(last_login);
```

## 🔄 Flujo de Datos

### Registro de Usuario

```
1. Request → Controller
2. Controller → Use Case
3. Use Case → Validator
4. Validator → Service
5. Service → Repository
6. Repository → Database
7. Response ← Controller
```

### Login de Usuario

```
1. Request → Controller
2. Controller → Use Case
3. Use Case → Validator
4. Validator → Service
5. Service → Repository
6. Repository → Database
7. Service → JWT Generator
8. Response ← Controller
```

## 🧪 Testing

### Casos de Prueba

```typescript
describe('AuthModule', () => {
  describe('User Registration', () => {
    it('should register a new user with valid data');
    it('should reject registration with invalid email');
    it('should reject registration with weak password');
    it('should reject registration with duplicate email');
    it('should reject registration with duplicate username');
  });

  describe('User Login', () => {
    it('should login with valid credentials');
    it('should reject login with invalid credentials');
    it('should lock account after multiple failed attempts');
    it('should update last_login on successful login');
  });

  describe('Security', () => {
    it('should hash passwords with bcrypt');
    it('should generate valid JWT tokens');
    it('should validate JWT tokens');
    it('should reject expired tokens');
  });
});
```

## 📊 Métricas y Monitoreo

### Métricas de Seguridad

- **Failed Login Attempts**: Intentos de login fallidos
- **Account Lockouts**: Cuentas bloqueadas
- **Password Strength**: Fuerza de contraseñas
- **Token Usage**: Uso de tokens JWT

### Métricas de Usuario

- **User Registrations**: Registros de usuarios
- **Active Users**: Usuarios activos
- **Login Frequency**: Frecuencia de logins
- **Session Duration**: Duración de sesiones

## 🚀 Configuración

### Variables de Entorno

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Password Security
BCRYPT_SALT_ROUNDS=12

# Account Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=30m

# Database
DB_AUTH_NAME=animecre_auth
```

### Configuración de Servicios

```typescript
// AuthService Configuration
const authConfig = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  lockoutDuration: process.env.LOCKOUT_DURATION || '30m',
};
```

## 🔧 API Endpoints

### POST /api/users/add

**Descripción**: Registra un nuevo usuario en el sistema

**Request Body**:

```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "username": "juanperez",
  "email": "juan@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "first_name": "Juan",
      "last_name": "Pérez",
      "username": "juanperez",
      "email": "juan@ejemplo.com",
      "role": "user",
      "active": true
    }
  }
}
```

### POST /api/users/login

**Descripción**: Autentica un usuario en el sistema

**Request Body**:

```json
{
  "email": "juan@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "first_name": "Juan",
      "last_name": "Pérez",
      "username": "juanperez",
      "email": "juan@ejemplo.com",
      "role": "user"
    }
  }
}
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Usuario ya existe"

```bash
# Verificar que el email/username no esté en uso
# Verificar unicidad en base de datos
```

#### Error: "Contraseña inválida"

```bash
# Verificar que cumpla con los requisitos de seguridad
# Mínimo 8 caracteres, mayúsculas, minúsculas, números, símbolos
```

#### Error: "Cuenta bloqueada"

```bash
# Verificar login_attempts en base de datos
# Verificar locked_until
# Esperar tiempo de bloqueo o contactar administrador
```

#### Error: "Token inválido"

```bash
# Verificar que el token no haya expirado
# Verificar que el usuario esté activo
# Verificar que la cuenta no esté bloqueada
```

## 📈 Roadmap

### Funcionalidades Futuras

- [ ] **Email Verification**: Verificación de email
- [ ] **Password Reset**: Recuperación de contraseña
- [ ] **Two-Factor Authentication**: Autenticación de dos factores
- [ ] **Refresh Tokens**: Tokens de renovación
- [ ] **Role-Based Access Control**: Control de acceso basado en roles
- [ ] **Audit Logging**: Registro de auditoría
- [ ] **Session Management**: Gestión avanzada de sesiones

### Mejoras de Seguridad

- [ ] **Rate Limiting**: Límite de requests por IP
- [ ] **IP Whitelisting**: Lista blanca de IPs
- [ ] **Device Management**: Gestión de dispositivos
- [ ] **Security Headers**: Headers de seguridad
- [ ] **Input Sanitization**: Sanitización de entrada

---

**Última actualización**: 2024-09-28

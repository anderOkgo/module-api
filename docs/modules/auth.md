# Authentication Module (@auth/)

## 🔐 General Description

The authentication module (`@auth/`) handles everything related to users, authentication, authorization, and system security. It implements a robust authentication system with JWT, session management, and advanced security measures.

## 🏗️ Module Architecture

```
src/modules/auth/
├── application/
│   ├── use-cases/           # Use cases
│   │   ├── register-user.use-case.ts
│   │   └── login-user.use-case.ts
│   └── validators/          # Application validators
│       └── user-request.validator.ts
├── domain/
│   ├── models/             # Domain models
│   │   ├── User.ts
│   │   └── Login.ts
│   ├── services/           # Domain services
│   │   ├── auth.service.ts
│   │   └── auth.factory.ts
│   └── validators/          # Domain validators
│       ├── user.validator.ts
│       └── password.validator.ts
└── infrastructure/
    ├── controllers/        # Controllers
    │   └── user.controller.ts
    ├── routes/            # Routes
    │   └── user.routes.ts
    ├── repositories/      # Repository interfaces
    │   └── user.repository.ts
    └── user.mysql.ts      # MySQL implementation
```

## 📊 Data Models

### User Model

Contains user information:

- Personal data (first name, last name, username, email)
- Authentication data (password hash, role)
- Security data (login attempts, account lockout)
- Audit data (creation, modification, last login timestamps)

### Login Model

Handles authentication requests:

- Login with email or username
- Password validation
- Security token generation

## 🔧 Features

### 1. User Registration

**Endpoint**: `POST /api/users/add`

**Features**:

- Input data validation
- Email/username uniqueness verification
- Password hashing with bcrypt
- User creation in database
- JWT token generation

**Validations**:

- Valid and unique email
- Unique username
- Secure password (minimum 8 characters, uppercase, lowercase, numbers, symbols)
- Required names

### 2. User Authentication

**Endpoint**: `POST /api/users/login`

**Features**:

- Login with email or username
- Credential validation
- Failed attempt control
- Account lockout for excessive attempts
- Last login update
- JWT token generation

**Security Measures**:

- Login attempt limit (5 attempts)
- Temporary account lockout (30 minutes)
- Password hashing with salt
- JWT tokens with expiration

### 3. Session Management

**Features**:

- JWT tokens with configurable expiration
- Refresh tokens (future)
- Session invalidation
- Secure logout

## 🛡️ Security

### Password Validations

Password security requirements:

- Minimum 8 characters
- Maximum 128 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol
- Must not be a common password

### Access Control

Authentication middleware features:

- JWT token validation
- Expiration verification
- Active user verification
- Non-blocked account verification

### Security Measures

- **Rate Limiting**: Login attempt limits
- **Account Lockout**: Temporary lockout for failed attempts
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Signed tokens with expiration
- **Input Validation**: Multi-layer validation

## 🗄️ Database

### users Table

Stores user information:

- Personal data (names, username, email)
- Authentication data (password hash, role)
- Security data (login attempts, lockout)
- Audit timestamps
- Optimized indexes for queries

### email_verification Table

Manages email verification:

- Email addresses pending verification
- Verification codes
- Creation timestamps
- Indexes for optimization

## 🔄 Data Flow

### User Registration

1. Request → Controller
2. Controller → Use Case
3. Use Case → Validator
4. Validator → Service
5. Service → Repository
6. Repository → Database
7. Response ← Controller

### User Login

1. Request → Controller
2. Controller → Use Case
3. Use Case → Validator
4. Validator → Service
5. Service → Repository
6. Repository → Database
7. Service → JWT Generator
8. Response ← Controller

## 🧪 Testing

### Test Cases

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

## 📊 Metrics and Monitoring

### Security Metrics

- **Failed Login Attempts**: Failed login attempts
- **Account Lockouts**: Locked accounts
- **Password Strength**: Password strength
- **Token Usage**: JWT token usage

### User Metrics

- **User Registrations**: User registrations
- **Active Users**: Active users
- **Login Frequency**: Login frequency
- **Session Duration**: Session duration

## 🚀 Configuration

### Environment Variables

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

### Service Configuration

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

**Description**: Register a new user in the system

**Request Body**:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MyPassword123!"
}
```

**Response**:

```json
{
  "error": false,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "active": true
    }
  }
}
```

### POST /api/users/login

**Description**: Authenticate a user in the system

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "MyPassword123!"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Problems

#### Error: "User already exists"

```bash
# Verify that the email/username is not in use
# Verify uniqueness in database
```

#### Error: "Invalid password"

```bash
# Verify that it meets security requirements
# Minimum 8 characters, uppercase, lowercase, numbers, symbols
```

#### Error: "Account locked"

```bash
# Verify login_attempts in database
# Verify locked_until
# Wait for lockout time or contact administrator
```

#### Error: "Invalid token"

```bash
# Verify that the token has not expired
# Verify that the user is active
# Verify that the account is not locked
```

## 📈 Roadmap

### Future Features

- [ ] **Email Verification**: Email verification
- [ ] **Password Reset**: Password recovery
- [ ] **Two-Factor Authentication**: Two-factor authentication
- [ ] **Refresh Tokens**: Refresh tokens
- [ ] **Role-Based Access Control**: Role-based access control
- [ ] **Audit Logging**: Audit logging
- [ ] **Session Management**: Advanced session management

### Security Improvements

- [ ] **Rate Limiting**: Request limits per IP
- [ ] **IP Whitelisting**: IP whitelisting
- [ ] **Device Management**: Device management
- [ ] **Security Headers**: Security headers
- [ ] **Input Sanitization**: Input sanitization

---

**Last updated**: 2025-10-05

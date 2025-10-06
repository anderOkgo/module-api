# System Architecture

## 🏗️ General Architecture

Module-API implements **Clean Architecture**, **Hexagonal Architecture**, and **CQRS (Command Query Responsibility Segregation)** to maintain clean, maintainable, and scalable code.

## 📐 Architectural Principles

### 1. Clean Architecture

- **Framework Independence**: Code does not depend on external frameworks
- **Testability**: Easy to test without external dependencies
- **UI Independence**: Business logic does not depend on the interface
- **Database Independence**: Easy to change database

### 2. Hexagonal Architecture

- **Ports and Adapters**: Clear separation between business logic and infrastructure
- **Dependency Inversion**: Inner layers do not depend on outer layers
- **Testability**: Easy mocking of dependencies

### 3. CQRS (Command Query Responsibility Segregation)

- **Command Separation**: Write operations are separated from read operations
- **Optimized Models**: Different models for commands and queries
- **Scalability**: Independent scaling of read and write operations
- **Performance**: Optimized queries with views and caching capabilities

## 🏛️ Layer Structure

```
┌─────────────────────────────────────┐
│           Presentation              │
│        (Controllers, Routes)        │
├─────────────────────────────────────┤
│            Application              │
│    (Commands, Queries, Handlers)    │
├─────────────────────────────────────┤
│              Domain                 │
│        (Models, Entities)           │
├─────────────────────────────────────┤
│          Infrastructure             │
│    (Repositories, Database)         │
└─────────────────────────────────────┘
```

## 📁 Directory Structure

```
src/
├── modules/                           # Application modules
│   ├── auth/                         # Authentication module
│   │   ├── application/              # Application layer
│   │   │   ├── ports/               # Repository interfaces (output ports)
│   │   │   └── use-cases/           # Use cases
│   │   ├── domain/                  # Domain layer
│   │   │   └── entities/            # Domain entities
│   │   └── infrastructure/          # Infrastructure layer
│   │       ├── config/              # Module configuration (Composition Root)
│   │       ├── controllers/         # HTTP controllers
│   │       ├── documentation/       # Module Swagger documentation
│   │       └── persistence/         # Repository implementations
│   │
│   ├── finan/                        # Finance module
│   │   ├── application/
│   │   │   ├── ports/
│   │   │   └── use-cases/
│   │   ├── domain/
│   │   │   └── entities/
│   │   └── infrastructure/
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── documentation/
│   │       ├── models/              # Additional specific models
│   │       ├── persistence/
│   │       └── validation/          # Module-specific validations
│   │
│   └── series/                       # Series module (CQRS implemented)
│       ├── application/
│       │   ├── commands/            # Write operations (CQRS)
│       │   ├── queries/             # Read operations (CQRS)
│       │   ├── handlers/            # Command/Query handlers (CQRS)
│       │   │   ├── commands/        # Command handlers
│       │   │   └── queries/         # Query handlers
│       │   ├── ports/               # Repository interfaces
│       │   │   ├── series-write.repository.ts  # Write operations
│       │   │   └── series-read.repository.ts   # Read operations
│       │   ├── services/            # Application services
│       │   └── common/              # Common interfaces (Command, Query)
│       ├── domain/
│       │   ├── entities/
│       │   └── ports/               # Domain ports (e.g., ImageProcessorPort)
│       └── infrastructure/
│           ├── config/
│           ├── controllers/
│           │   └── series-cqrs.controller.ts  # CQRS controller
│           ├── documentation/
│           ├── persistence/
│           │   ├── series-write.mysql.ts       # Write repository
│           │   └── series-read.mysql.ts        # Read repository
│           ├── services/            # Infrastructure services (adapters)
│           └── validation/
│
├── infrastructure/                   # Global infrastructure
│   ├── data/                        # Database connections
│   │   └── mysql/                   # MySQL implementation
│   │       ├── database.ts          # Database class with reconnection handling
│   │       └── mysql.helper.ts      # MySQL helpers
│   ├── services/                    # Shared services
│   │   ├── cyfer.ts                 # Encryption service
│   │   ├── email.ts                 # Email service
│   │   ├── image.ts                 # Image processing
│   │   ├── swagger.ts               # Swagger configuration
│   │   ├── swagger-documentation.ts # Additional documentation
│   │   ├── swagger.schemas.ts       # Swagger schemas
│   │   ├── upload.ts                # Upload service
│   │   └── validate-token.ts        # JWT validation middleware
│   ├── validation/                  # Global validations
│   │   └── generalValidation.ts
│   └── helpers/                     # Global helpers
│       ├── middle.helper.ts
│       ├── my.database.helper.ts
│       └── validatios.helper.ts
│
├── index.ts                         # Entry point (starts Server)
└── server.ts                        # Main Server class
```

## 🔄 Data Flow

### 1. Request Flow (Detailed)

```
1. HTTP Request (Express)
   ↓
2. Middleware (CORS, JSON Parser)
   ↓
3. Authentication Middleware (validateToken) - if applicable
   ↓
4. Upload Middleware (multer) - if applicable
   ↓
5. Controller (Infrastructure)
   - Extracts request data
   - Validates input format
   ↓
6. Command/Query Handler (Application - CQRS)
   - Creates Command/Query object
   - Delegates to appropriate handler
   ↓
7. Command/Query Handler (Application)
   - Validates business rules (Commands only)
   - Orchestrates the flow
   ↓
8. Application Service (if applicable)
   - Complex application logic
   ↓
9. Repository (Infrastructure - adapter)
   - Implements data access
   - Write Repository (Commands) / Read Repository (Queries)
   ↓
10. Database Class
    - Executes SQL query
    ↓
11. MySQL Database
```

### 2. Response Flow

```
MySQL Database
   ↓
Database Class (executeSafeQuery)
   ↓
Repository (transforms result)
   ↓
Command/Query Handler (maps to DTO/Response)
   ↓
Controller (formats HTTP response)
   ↓
HTTP Response (JSON)
```

### 3. Error Flow

```
Error in any layer
   ↓
Try-Catch in superior layer
   ↓
Error Handler Middleware (if not caught)
   ↓
HTTP Error Response (4xx/5xx)
   +
Email notification (if system error)
```

## 🎯 CQRS Implementation

### CQRS Overview

**CQRS (Command Query Responsibility Segregation)** has been fully implemented in the **Series** module as a proof of concept. This pattern separates write operations (Commands) from read operations (Queries), providing better scalability, maintainability, and performance optimization.

### CQRS Architecture in Series Module

```
series/
├── application/
│   ├── commands/                    # Write operations
│   │   ├── create-series.command.ts
│   │   ├── update-series.command.ts
│   │   ├── delete-series.command.ts
│   │   └── ...
│   ├── queries/                     # Read operations
│   │   ├── get-series-by-id.query.ts
│   │   ├── search-series.query.ts
│   │   └── ...
│   ├── handlers/
│   │   ├── commands/                # Command handlers
│   │   └── queries/                 # Query handlers
│   └── ports/
│       ├── series-write.repository.ts  # Write repository
│       └── series-read.repository.ts   # Read repository
```

### CQRS Benefits

1. **Separation of Concerns**: Commands handle write operations with business logic, Queries handle read operations with optimized projections
2. **Performance**: Read repository can use optimized views and caching strategies
3. **Scalability**: Read and write operations can be scaled independently
4. **Maintainability**: Clear separation makes code easier to understand and maintain

### Command Pattern

```typescript
export interface Command<TResult = void> {
  readonly timestamp: Date;
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
```

**Example Command:**

```typescript
export class CreateSeriesCommand implements Command<SeriesResponse> {
  readonly timestamp: Date = new Date();

  constructor(public readonly name: string, public readonly year: number, public readonly imageBuffer?: Buffer) {}
}
```

### Query Pattern

```typescript
export interface Query<TResult> {
  readonly cacheKey?: string;
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult>;
}
```

**Example Query:**

```typescript
export class GetSeriesByIdQuery implements Query<SeriesResponse | null> {
  readonly cacheKey: string;

  constructor(public readonly id: number) {
    this.cacheKey = `series:${id}`;
  }
}
```

### Repository Separation

**Write Repository** (Commands):

- Handles all write operations (CREATE, UPDATE, DELETE)
- Contains business logic validation
- Manages transactions
- Updates rankings and relationships

**Read Repository** (Queries):

- Optimized for read operations
- Uses database views for complex queries
- Prepared for caching strategies
- Minimal validation (only input sanitization)

### CQRS Implementation Status

| Module     | CQRS Status     | Commands | Queries | Benefits                             |
| ---------- | --------------- | -------- | ------- | ------------------------------------ |
| **Series** | ✅ **Complete** | 9        | 7       | Full separation, optimized queries   |
| **Finan**  | 🔄 **Planned**  | 3        | 4       | Analytics and reporting optimization |
| **Auth**   | ⚠️ **Optional** | 2        | 2       | Simple operations, minimal benefit   |

### Future CQRS Enhancements

1. **Event Sourcing**: Add domain events for audit trails
2. **Caching Layer**: Implement Redis for query caching
3. **Read Replicas**: Separate read database for high availability
4. **Eventual Consistency**: Implement event-driven synchronization

## 📦 System Modules

### Auth Module

**Purpose**: Authentication and user management

**Features**:

- User registration with email verification
- JWT login
- Failed login attempt management
- Account locking for security
- Password hashing with bcrypt

**Use Cases**:

- `RegisterUserUseCase` - Register new users
- `LoginUserUseCase` - User authentication

**Endpoints**:

- `POST /api/users/add` - User registration
- `POST /api/users/login` - Login

**Database**: `MYDATABASEAUTH`

### Series Module (CQRS Implemented)

**Purpose**: Anime series management

**Features**:

- Complete CRUD of series
- Optimized image management
- Series search and filtering
- Genre and demographic management
- Alternative titles management
- Production years

**CQRS Implementation**:

- **Commands** (9): `CreateSeriesCommand`, `UpdateSeriesCommand`, `DeleteSeriesCommand`, `AssignGenresCommand`, `RemoveGenresCommand`, `AddTitlesCommand`, `RemoveTitlesCommand`, `CreateSeriesCompleteCommand`, `UpdateSeriesImageCommand`
- **Queries** (7): `GetSeriesByIdQuery`, `SearchSeriesQuery`, `GetAllSeriesQuery`, `GetGenresQuery`, `GetDemographicsQuery`, `GetProductionYearsQuery`, `GetProductionsQuery`
- **Handlers**: Separate command and query handlers with optimized logic
- **Repositories**: `SeriesWriteRepository` and `SeriesReadRepository`

**Services**:

- `ImageService` - Application logic for images
- `SeriesImageProcessorService` - Technical image processing

**Endpoints**:

- `GET /api/series/:id` - Get series by ID
- `POST /api/series` - List productions
- `POST /api/series/create` - Create series (requires auth)
- `PUT /api/series/:id` - Update series (requires auth)
- `DELETE /api/series/:id` - Delete series (requires auth)
- `GET /api/series/list` - List all (requires auth)
- `POST /api/series/search` - Search series
- And more... (see Swagger documentation)

**Database**: `MYDATABASEANIME`

### Finan Module

**Purpose**: Financial management

**Features**:

- Financial movement management
- Transaction CRUD
- Initial data loading

**Use Cases**:

- `GetInitialLoadUseCase` - Load initial data
- `PutMovementUseCase` - Create movement
- `UpdateMovementUseCase` - Update movement
- `DeleteMovementUseCase` - Delete movement

**Endpoints**:

- Routes under `/api/finan`

**Database**: `MYDATABASEANIME`

## 🧩 Main Components

### Composition Root (Config)

- **Responsibility**: Assemble and wire all module dependencies
- **Location**: `modules/{module}/infrastructure/config/{module}.module.ts`
- **Pattern**: Composition Root, Dependency Injection
- **Features**:
  - `build{Module}Module()` function that builds the entire module
  - Creates instances of repositories, services, use cases and controllers
  - Configures HTTP routes with authentication middleware
  - Returns an object with the router and all created instances
  - Single point of configuration for the complete module

### Controllers

- **Responsibility**: HTTP request/response handling
- **Location**: `modules/{module}/infrastructure/controllers/`
- **Pattern**: Thin controllers, delegation to use cases
- **Features**:
  - Receive use cases through dependency injection in constructor
  - Validate input and format response
  - HTTP error handling
  - Integration with middleware (multer for uploads, validateToken for auth)

### Use Cases (Legacy) / CQRS Handlers (New)

- **Responsibility**: Specific application logic
- **Location**: `modules/{module}/application/use-cases/` (legacy) or `modules/{module}/application/handlers/` (CQRS)
- **Pattern**: One use case per operation (Command Pattern) / Command/Query Handlers (CQRS)
- **Features**:
  - `execute()` method that implements the use case flow
  - Receive repositories and services through dependency injection
  - Orchestrate business logic
  - Validate business rules
  - Independent of HTTP infrastructure
  - **CQRS**: Commands handle write operations, Queries handle read operations

### Application Services

- **Responsibility**: Orchestrate complex application logic
- **Location**: `modules/{module}/application/services/`
- **Pattern**: Application Service Pattern
- **Example**: `ImageService` that orchestrates image processing

### Domain Entities

- **Responsibility**: Represent business concepts
- **Location**: `modules/{module}/domain/entities/`
- **Pattern**: Domain Model, Value Objects
- **Features**: TypeScript interfaces that define data structure

### Ports (Interfaces)

- **Responsibility**: Define contracts for external adapters
- **Location**:
  - `modules/{module}/application/ports/` - Repository ports
  - `modules/{module}/domain/ports/` - Domain service ports
- **Pattern**: Port and Adapter (Hexagonal Architecture)
- **Features**:
  - TypeScript interfaces that define methods
  - Enable dependency inversion
  - Facilitate testing with mocks

### Repositories (Adapters)

- **Responsibility**: Data access and persistence
- **Location**: `modules/{module}/infrastructure/persistence/`
- **Pattern**: Repository Pattern
- **Features**:
  - Implement interfaces defined in `application/ports/`
  - Use the global `Database` class
  - CRUD methods and domain-specific queries
  - Database error handling

## 🔧 Design Patterns

### 1. Composition Root Pattern

```typescript
// Location: modules/{module}/infrastructure/config/{module}.module.ts
export function buildAuthModule() {
  // 1. Create repository (Infrastructure Layer)
  const userRepository = new userMysqlRepository();

  // 2. Create Use Cases (Application Layer) - injecting dependencies
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository);

  // 3. Create Controller (Infrastructure Layer) - injecting Use Cases
  const userController = new UserController(registerUserUseCase, loginUserUseCase);

  // 4. Configure routes
  const router = Router();
  router.post('/add', userController.addUser);
  router.post('/login', userController.loginUser);

  return { router, userController, userRepository, registerUserUseCase, loginUserUseCase };
}
```

**Benefits**:

- Single point of dependency configuration
- Facilitates testing by being able to inject mocks
- Makes module dependencies explicit
- Allows controlled initialization

### 2. Ports and Adapters (Hexagonal Architecture)

```typescript
// Port (Application Layer) - Define the contract
// Location: application/ports/user.repository.ts
export interface UserRepository {
  findById(id: number): Promise<User | null>;
  create(user: UserCreateRequest): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

// Adapter (Infrastructure Layer) - Implement the contract
// Location: infrastructure/persistence/user.mysql.ts
export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.length > 0 ? result[0] : null;
  }
  // ... more implementations
}
```

**Example in Domain Layer**:

```typescript
// Port in Domain - For domain services
// Location: domain/ports/image-processor.port.ts
export interface ImageProcessorPort {
  processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string>;
  deleteImage(imagePath: string): Promise<void>;
}

// Adapter in Infrastructure
// Location: infrastructure/services/image-processor.service.ts
export class SeriesImageProcessorService implements ImageProcessorPort {
  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    const optimizedImageBuffer = await ImageProcessor.optimizeImage(imageBuffer);
    const filename = `${seriesId}.jpg`;
    await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
    return `/img/tarjeta/${filename}`;
  }
}
```

### 3. Use Case Pattern (Command Pattern) / CQRS Pattern

```typescript
// Location: application/use-cases/register.use-case.ts (Legacy)
export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userData: UserCreateRequest): Promise<UserResponse> {
    // 1. Business validations
    // 2. Flow orchestration
    // 3. Repository delegation
    const user = await this.userRepository.create(userData);
    return this.mapToResponse(user);
  }
}

// Location: application/handlers/commands/create-series.handler.ts (CQRS)
export class CreateSeriesHandler implements CommandHandler<CreateSeriesCommand, SeriesResponse> {
  constructor(private readonly writeRepository: SeriesWriteRepository) {}

  async execute(command: CreateSeriesCommand): Promise<SeriesResponse> {
    // 1. Validate command
    // 2. Normalize data
    // 3. Execute write operation
    // 4. Return result
  }
}
```

**Features**:

- One use case = One business operation
- Independent of HTTP infrastructure
- Easily testable
- Receives dependencies through constructor
- **CQRS**: Commands for write operations, Queries for read operations

### 4. Application Service Pattern

```typescript
// Location: application/services/image.service.ts
export class ImageService {
  constructor(private readonly imageProcessor: ImageProcessorPort) {}

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    // Business logic: validations
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image buffer is required');
    }

    // Delegate to infrastructure adapter
    return await this.imageProcessor.processAndSaveImage(imageBuffer, seriesId);
  }
}
```

### 5. Dependency Injection Pattern

- **Manual DI**: We don't use IoC containers, we do manual injection in Composition Root
- **Constructor Injection**: All dependencies are injected through constructor
- **Interface-based**: Interfaces are injected, not concrete implementations

### 6. Middleware Pattern

```typescript
// JWT authentication middleware
// Location: infrastructure/services/validate-token.ts
const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.headers['authorization'];
  const bearerToken = headerToken.slice(7); // Remove 'Bearer '

  jwt.verify(bearerToken, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.body.username = decoded.username;
    next();
  });
};
```

**Usage in routes**:

```typescript
router.get('/list', validateToken, seriesController.getAllSeries);
router.post('/create', validateToken, uploadMiddleware, seriesController.createSeries);
```

## 🔐 Security

### Authentication and Authorization

- **JWT Tokens**: For stateless authentication

  - Generated with `jsonwebtoken` on login
  - Contains user `username` and `role`
  - Validated with `validateToken` middleware
  - Format: `Bearer {token}` in `Authorization` header

- **bcrypt**: For password hashing

  - Cost of 10 rounds
  - Used in registration and login

- **Authentication Middleware**:
  - `validateToken` validates JWT on protected routes
  - Verifies `Authorization` header
  - Decodes token and adds `username` to `req.body`
  - Returns 401 if token is invalid

### Data Validation

- **Input Validation**:
  - Validation in multiple layers (controller → use case → repository)
  - Module-specific validations in `infrastructure/validation/`
- **Domain Validation**:

  - Business rules in use cases
  - Entity validations in the domain

- **Database Validation**:
  - Prepared statements with `executeSafeQuery`
  - String escaping with `connection.escape()`
  - Protection against SQL injection

### Error Handling

- **Error Handling Middleware**: Captures global errors in `server.ts`
- **Database Error Handling**:
  - `executeSafeQuery` captures database errors
  - Sends email notification to administrators
  - Returns generic response to client (does not expose internal details)
- **Graceful Shutdown**: Handling SIGINT/SIGTERM signals to close connections properly

## 🧪 Testing

### Testing Strategy

- **Unit Tests**: For services and use cases
- **Integration Tests**: For repositories and controllers
- **E2E Tests**: For complete flows

### Mocking

- **Repository Mocks**: To isolate business logic
- **Service Mocks**: For controller testing
- **Database Mocks**: For integration testing

## 🗄️ Database Infrastructure

### Database Class

**Location**: `infrastructure/data/mysql/database.ts`

**Features**:

- **Database-specific Connection**: Constructor accepts database name
- **Auto-Reconnection**: Automatic handling of connection loss
  - Detects `PROTOCOL_CONNECTION_LOST` errors
  - Waits 2 seconds and reconnects automatically
  - Handles fatal errors
- **Main Methods**:
  - `open()`: Opens initial connection
  - `close()`: Closes connection gracefully
  - `executeQuery()`: Executes query without error handling
  - `executeSafeQuery()`: Executes query with try-catch and email notification
  - `testConnection()`: Verifies connection with ping
  - `myEscape()`: Escapes strings to prevent SQL injection

### Multi-Database Configuration

The project uses multiple databases:

- `MYDATABASEANIME` - Main database (series)
- `MYDATABASEAUTH` - Authentication database (users)
- `MYDATABASE` - Generic database for health checks

The variables are configured in `.env`:

```env
MYHOST=localhost
MYUSER=root
MYPASSWORD=secret
MYPORT=3306
MYDATABASEANIME=anime_db
MYDATABASEAUTH=auth_db
```

## 📚 API Documentation (Swagger)

### Modular Documentation Architecture

**Structure**:

- **Main Documentation**: `infrastructure/services/swagger.ts`

  - Defines OpenAPI 3.0 configuration
  - Combines documentation from all modules
  - Defines global schemas and securitySchemes

- **Global Schemas**: `infrastructure/services/swagger.schemas.ts`

  - Contains all reusable schemas
  - Used by multiple endpoints

- **Module Documentation**: `modules/{module}/infrastructure/documentation/`
  - Each module defines its own endpoints
  - Imported and combined in the main file
  - Examples:
    - `user.swagger.ts` - Auth documentation
    - `series.swagger.ts` - Series documentation
    - `finan.swagger.ts` - Finance documentation

**Benefits**:

- Documentation distributed by module
- Easy maintenance
- Auto-complete for API clients
- Interactive UI at `/api-docs`

## 📊 Monitoring and Logging

### Health Check Endpoint

**Route**: `GET /health`

**Response**:

```json
{
  "status": "UP",
  "timestamp": "2024-09-28T10:30:00Z",
  "uptime": 3600,
  "environment": "development",
  "version": "2.0.9",
  "services": {
    "database": "UP",
    "api": "UP"
  }
}
```

**Features**:

- Verifies database connection with `testConnection()`
- Returns 200 if everything is UP, 503 if something is DOWN
- Includes process uptime
- Useful for load balancers and monitoring tools

### Logging

- **Console Logging**: For development

  - Database connection/disconnection logs
  - Error and exception logs
  - Server startup logs

- **Error Tracking**:
  - Database errors are sent by email
  - `sendEmail(emailAddress, 'System Error', errorMessage)`
  - Prevents spam with intelligent error handling

### Graceful Shutdown

**Features**:

- Captures SIGINT (Ctrl+C) and SIGTERM signals
- Closes HTTP server first
- Closes all active connections
- Closes database connections
- 5 second timeout to force closure
- Clear logs of the shutdown process

## 🚀 Scalability

### Horizontal Scaling

- **Stateless Services**: Stateless services
- **Load Balancing**: Load balancer
- **Database Sharding**: Database partitioning

### Vertical Scaling

- **Resource Optimization**: Resource optimization
- **Caching**: Caching strategies
- **Database Optimization**: Query optimization

## 🔄 Migration and Versioning

### Database Migrations

- **Versioning**: Schema version control
- **Rollback**: Reversion capability
- **Data Migration**: Data migration

### API Versioning

- **URL Versioning**: Versions in URL
- **Header Versioning**: Versions in headers
- **Backward Compatibility**: Backward compatibility

## 📈 Metrics and KPIs

### Performance Metrics

- **Response Time**: Response time
- **Throughput**: Performance
- **Error Rate**: Error rate

### Business Metrics

- **User Registration**: User registration
- **API Usage**: API usage
- **Feature Adoption**: Feature adoption

## 🎯 Implemented Best Practices

### Clean Architecture

✅ **Layer Separation**:

- Domain: Pure entities without external dependencies
- Application: Use cases with business logic
- Infrastructure: Technical details (DB, HTTP, files)

✅ **Dependency Inversion**:

- Interfaces (ports) defined in application/domain
- Implementations (adapters) in infrastructure
- Dependencies point towards the domain

### Hexagonal Architecture

✅ **Ports and Adapters**:

- Ports: Interfaces that define contracts
- Adapters: Concrete implementations
- Example: `UserRepository` (port) ← `userMysqlRepository` (adapter)

### SOLID Principles

✅ **Single Responsibility**: Each class/function has a single responsibility
✅ **Open/Closed**: Extensible without modifying existing code (via interfaces)
✅ **Liskov Substitution**: Adapters are interchangeable
✅ **Interface Segregation**: Small and specific interfaces
✅ **Dependency Inversion**: Depend on abstractions, not implementations

### Dependency Injection

✅ **Manual DI via Composition Root**:

- No DI frameworks (InversifyJS, etc.)
- Everything wired in one place per module
- Easy to understand and debug
- Simplified testing with mocks

### Modularity

✅ **Independent Modules**:

- Each module is self-contained
- Can be easily extracted to a microservice
- Communication via well-defined interfaces

### Security

✅ **Implementations**:

- JWT for stateless authentication
- bcrypt for password hashing
- Prepared statements against SQL injection
- Centralized authentication middleware
- Error handling that does not expose sensitive information

### Observability

✅ **Features**:

- Health check endpoint
- Structured logging
- Error notifications by email
- Graceful shutdown

## 📝 Implementation Notes

### Naming Conventions

- **Entities**: `{Entity}.entity.ts` (e.g., `user.entity.ts`)
- **Use Cases**: `{action}-{entity}.use-case.ts` (e.g., `register-user.use-case.ts`)
- **Repositories**: `{entity}.repository.ts` (interface), `{entity}.mysql.ts` (implementation)
- **Controllers**: `{entity}.controller.ts`
- **Modules**: `{module}.module.ts`
- **CQRS**: `{action}-{entity}.command.ts`, `{action}-{entity}.query.ts`, `{action}-{entity}.handler.ts`

### Workflow for New Modules

1. **Domain Layer** - Define entities
2. **Application Layer** - Define ports (interfaces)
3. **Application Layer** - Create use cases (or CQRS commands/queries)
4. **Infrastructure Layer** - Implement adapters (repositories)
5. **Infrastructure Layer** - Create controllers
6. **Infrastructure Layer** - Create Swagger documentation
7. **Infrastructure Layer** - Create Composition Root (module.ts)
8. **Server.ts** - Register module

### Performance Considerations

- **Connection Pooling**: Consider implementing MySQL connection pool
- **Caching**: Consider adding Redis for caching
- **Query Optimization**: Review N+1 queries and add indexes
- **Image Optimization**: Already implemented with image processing
- **CQRS Optimization**: Use database views for complex read operations

---

**Last updated**: 2025-10-05

**Project Version**: 2.0.9

**Author**: Anderokgo

**Status**: ✅ Documentation updated and verified against source code

**Architecture**: Clean Architecture + Hexagonal Architecture + CQRS

**CQRS Status**: ✅ Series module fully migrated, Finan module planned

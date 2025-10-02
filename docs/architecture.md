# Arquitectura del Sistema

## 🏗️ Arquitectura General

Module-API implementa **Clean Architecture** y **Hexagonal Architecture** para mantener un código limpio, mantenible y escalable.

## 📐 Principios Arquitectónicos

### 1. Clean Architecture

- **Independencia de frameworks**: El código no depende de frameworks externos
- **Testabilidad**: Fácil de testear sin dependencias externas
- **Independencia de UI**: La lógica de negocio no depende de la interfaz
- **Independencia de base de datos**: Fácil cambio de base de datos

### 2. Hexagonal Architecture

- **Puertos y Adaptadores**: Separación clara entre lógica de negocio y infraestructura
- **Inversión de Dependencias**: Las capas internas no dependen de las externas
- **Testabilidad**: Fácil mockeo de dependencias

## 🏛️ Estructura de Capas

```
┌─────────────────────────────────────┐
│           Presentation              │
│        (Controllers, Routes)        │
├─────────────────────────────────────┤
│            Application              │
│        (Use Cases, Services)        │
├─────────────────────────────────────┤
│              Domain                 │
│        (Models, Entities)           │
├─────────────────────────────────────┤
│          Infrastructure             │
│    (Repositories, Database)         │
└─────────────────────────────────────┘
```

## 📁 Estructura de Directorios

```
src/
├── modules/                           # Módulos de la aplicación
│   ├── auth/                         # Módulo de autenticación
│   │   ├── application/              # Capa de aplicación
│   │   │   ├── ports/               # Interfaces de repositorios (puertos de salida)
│   │   │   └── use-cases/           # Casos de uso
│   │   ├── domain/                  # Capa de dominio
│   │   │   └── entities/            # Entidades de dominio
│   │   └── infrastructure/          # Capa de infraestructura
│   │       ├── config/              # Configuración del módulo (Composition Root)
│   │       ├── controllers/         # Controladores HTTP
│   │       ├── documentation/       # Documentación Swagger del módulo
│   │       └── persistence/         # Implementaciones de repositorios
│   │
│   ├── finan/                        # Módulo financiero
│   │   ├── application/
│   │   │   ├── ports/
│   │   │   └── use-cases/
│   │   ├── domain/
│   │   │   └── entities/
│   │   └── infrastructure/
│   │       ├── config/
│   │       ├── controllers/
│   │       ├── documentation/
│   │       ├── models/              # Modelos adicionales específicos
│   │       ├── persistence/
│   │       └── validation/          # Validaciones específicas del módulo
│   │
│   └── series/                       # Módulo de series
│       ├── application/
│       │   ├── ports/               # Interfaces de repositorios
│       │   ├── services/            # Servicios de aplicación
│       │   └── use-cases/
│       ├── domain/
│       │   ├── entities/
│       │   └── ports/               # Puertos de dominio (ej: ImageProcessorPort)
│       └── infrastructure/
│           ├── config/
│           ├── controllers/
│           ├── documentation/
│           ├── persistence/
│           ├── services/            # Servicios de infraestructura (adaptadores)
│           └── validation/
│
├── infrastructure/                   # Infraestructura global
│   ├── data/                        # Conexiones a base de datos
│   │   └── mysql/                   # Implementación MySQL
│   │       ├── database.ts          # Clase Database con manejo de reconexión
│   │       └── mysql.helper.ts      # Helpers de MySQL
│   ├── services/                    # Servicios compartidos
│   │   ├── cyfer.ts                 # Servicio de encriptación
│   │   ├── email.ts                 # Servicio de email
│   │   ├── image.ts                 # Procesamiento de imágenes
│   │   ├── swagger.ts               # Configuración de Swagger
│   │   ├── swagger-documentation.ts # Documentación adicional
│   │   ├── swagger.schemas.ts       # Schemas de Swagger
│   │   ├── upload.ts                # Servicio de upload
│   │   └── validate-token.ts        # Middleware de validación JWT
│   ├── validation/                  # Validaciones globales
│   │   └── generalValidation.ts
│   └── helpers/                     # Helpers globales
│       ├── middle.helper.ts
│       ├── my.database.helper.ts
│       └── validatios.helper.ts
│
├── index.ts                         # Punto de entrada (inicia Server)
└── server.ts                        # Clase Server principal
```

## 🔄 Flujo de Datos

### 1. Request Flow (Detallado)

```
1. HTTP Request (Express)
   ↓
2. Middleware (CORS, JSON Parser)
   ↓
3. Middleware de Autenticación (validateToken) - si aplica
   ↓
4. Middleware de Upload (multer) - si aplica
   ↓
5. Controller (Infrastructure)
   - Extrae datos del request
   - Valida formato de entrada
   ↓
6. Use Case (Application)
   - Valida reglas de negocio
   - Orquesta el flujo
   ↓
7. Application Service (si aplica)
   - Lógica compleja de aplicación
   ↓
8. Repository (Infrastructure - adaptador)
   - Implementa acceso a datos
   ↓
9. Database Class
   - Ejecuta query SQL
   ↓
10. MySQL Database
```

### 2. Response Flow

```
MySQL Database
   ↓
Database Class (executeSafeQuery)
   ↓
Repository (transforma resultado)
   ↓
Use Case (mapea a DTO/Response)
   ↓
Controller (formatea respuesta HTTP)
   ↓
HTTP Response (JSON)
```

### 3. Error Flow

```
Error en cualquier capa
   ↓
Try-Catch en capa superior
   ↓
Error Handler Middleware (si no se capturó)
   ↓
HTTP Error Response (4xx/5xx)
   +
Notificación por email (si es error de sistema)
```

## 📦 Módulos del Sistema

### Módulo Auth

**Propósito**: Gestión de autenticación y usuarios

**Funcionalidades**:

- Registro de usuarios con verificación por email
- Login con JWT
- Gestión de intentos de login fallidos
- Bloqueo de cuentas por seguridad
- Hash de contraseñas con bcrypt

**Use Cases**:

- `RegisterUserUseCase` - Registro de nuevos usuarios
- `LoginUserUseCase` - Autenticación de usuarios

**Endpoints**:

- `POST /api/users/add` - Registro de usuario
- `POST /api/users/login` - Login

**Base de Datos**: `MYDATABASEAUTH`

### Módulo Series

**Propósito**: Gestión de series de anime

**Funcionalidades**:

- CRUD completo de series
- Gestión de imágenes optimizadas
- Búsqueda y filtrado de series
- Gestión de géneros y demografías
- Gestión de títulos alternativos
- Años de producción

**Use Cases** (15 total):

- Consulta: `GetAllSeriesUseCase`, `GetSeriesByIdUseCase`, `SearchSeriesUseCase`
- Creación: `CreateSeriesUseCase`, `CreateSeriesCompleteUseCase`
- Actualización: `UpdateSeriesUseCase`, `UpdateSeriesImageUseCase`
- Eliminación: `DeleteSeriesUseCase`
- Catálogos: `GetProductionsUseCase`, `GetGenresUseCase`, `GetDemographicsUseCase`, `GetProductionYearsUseCase`
- Relaciones: `AssignGenresUseCase`, `RemoveGenresUseCase`, `AddTitlesUseCase`, `RemoveTitlesUseCase`

**Servicios**:

- `ImageService` - Lógica de aplicación para imágenes
- `SeriesImageProcessorService` - Procesamiento técnico de imágenes

**Endpoints**:

- `GET /api/series/:id` - Obtener serie por ID
- `POST /api/series` - Listar producciones
- `POST /api/series/create` - Crear serie (requiere auth)
- `PUT /api/series/:id` - Actualizar serie (requiere auth)
- `DELETE /api/series/:id` - Eliminar serie (requiere auth)
- `GET /api/series/list` - Listar todas (requiere auth)
- `POST /api/series/search` - Buscar series
- Y más... (ver documentación Swagger)

**Base de Datos**: `MYDATABASEANIME`

### Módulo Finan

**Propósito**: Gestión financiera

**Funcionalidades**:

- Gestión de movimientos financieros
- CRUD de transacciones
- Carga inicial de datos

**Use Cases**:

- `GetInitialLoadUseCase` - Carga datos iniciales
- `PutMovementUseCase` - Crear movimiento
- `UpdateMovementUseCase` - Actualizar movimiento
- `DeleteMovementUseCase` - Eliminar movimiento

**Endpoints**:

- Rutas bajo `/api/finan`

**Base de Datos**: `MYDATABASEANIME`

## 🧩 Componentes Principales

### Composition Root (Config)

- **Responsabilidad**: Ensamblar y cablear todas las dependencias del módulo
- **Ubicación**: `modules/{module}/infrastructure/config/{module}.module.ts`
- **Patrón**: Composition Root, Inyección de Dependencias
- **Características**:
  - Función `build{Module}Module()` que construye todo el módulo
  - Crea instancias de repositorios, servicios, use cases y controladores
  - Configura las rutas HTTP con middleware de autenticación
  - Retorna un objeto con el router y todas las instancias creadas
  - Punto único de configuración para el módulo completo

### Controllers

- **Responsabilidad**: Manejo de HTTP requests/responses
- **Ubicación**: `modules/{module}/infrastructure/controllers/`
- **Patrón**: Thin controllers, delegación a use cases
- **Características**:
  - Reciben use cases por inyección de dependencia en constructor
  - Validan entrada y formatean respuesta
  - Manejo de errores HTTP
  - Integración con middleware (multer para uploads, validateToken para auth)

### Use Cases

- **Responsabilidad**: Lógica de aplicación específica
- **Ubicación**: `modules/{module}/application/use-cases/`
- **Patrón**: Un caso de uso por operación (Command Pattern)
- **Características**:
  - Método `execute()` que implementa el flujo del caso de uso
  - Reciben repositorios y servicios por inyección de dependencia
  - Orquestan la lógica de negocio
  - Validan reglas de negocio
  - Independientes de la infraestructura HTTP

### Application Services

- **Responsabilidad**: Orquestar lógica de aplicación compleja
- **Ubicación**: `modules/{module}/application/services/`
- **Patrón**: Application Service Pattern
- **Ejemplo**: `ImageService` que orquesta el procesamiento de imágenes

### Domain Entities

- **Responsabilidad**: Representar conceptos de negocio
- **Ubicación**: `modules/{module}/domain/entities/`
- **Patrón**: Domain Model, Value Objects
- **Características**: Interfaces TypeScript que definen la estructura de datos

### Ports (Interfaces)

- **Responsabilidad**: Definir contratos para adaptadores externos
- **Ubicación**:
  - `modules/{module}/application/ports/` - Puertos de repositorios
  - `modules/{module}/domain/ports/` - Puertos de servicios de dominio
- **Patrón**: Port and Adapter (Hexagonal Architecture)
- **Características**:
  - Interfaces TypeScript que definen métodos
  - Permiten inversión de dependencias
  - Facilitan testing con mocks

### Repositories (Adapters)

- **Responsabilidad**: Acceso a datos y persistencia
- **Ubicación**: `modules/{module}/infrastructure/persistence/`
- **Patrón**: Repository Pattern
- **Características**:
  - Implementan interfaces definidas en `application/ports/`
  - Usan la clase `Database` global
  - Métodos CRUD y consultas específicas del dominio
  - Manejo de errores de base de datos

## 🔧 Patrones de Diseño

### 1. Composition Root Pattern

```typescript
// Ubicación: modules/{module}/infrastructure/config/{module}.module.ts
export function buildAuthModule() {
  // 1. Crear repositorio (Infrastructure Layer)
  const userRepository = new userMysqlRepository();

  // 2. Crear Use Cases (Application Layer) - inyectando dependencias
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository);

  // 3. Crear Controlador (Infrastructure Layer) - inyectando Use Cases
  const userController = new UserController(registerUserUseCase, loginUserUseCase);

  // 4. Configurar rutas
  const router = Router();
  router.post('/add', userController.addUser);
  router.post('/login', userController.loginUser);

  return { router, userController, userRepository, registerUserUseCase, loginUserUseCase };
}
```

**Beneficios**:

- Punto único de configuración de dependencias
- Facilita testing al poder inyectar mocks
- Hace explícitas las dependencias del módulo
- Permite inicialización controlada

### 2. Ports and Adapters (Hexagonal Architecture)

```typescript
// Puerto (Application Layer) - Define el contrato
// Ubicación: application/ports/user.repository.ts
export interface UserRepository {
  findById(id: number): Promise<User | null>;
  create(user: UserCreateRequest): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

// Adaptador (Infrastructure Layer) - Implementa el contrato
// Ubicación: infrastructure/persistence/user.mysql.ts
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
  // ... más implementaciones
}
```

**Ejemplo en Domain Layer**:

```typescript
// Puerto en Domain - Para servicios de dominio
// Ubicación: domain/ports/image-processor.port.ts
export interface ImageProcessorPort {
  processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string>;
  deleteImage(imagePath: string): Promise<void>;
}

// Adaptador en Infrastructure
// Ubicación: infrastructure/services/image-processor.service.ts
export class SeriesImageProcessorService implements ImageProcessorPort {
  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    const optimizedImageBuffer = await ImageProcessor.optimizeImage(imageBuffer);
    const filename = `${seriesId}.jpg`;
    await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
    return `/img/tarjeta/${filename}`;
  }
}
```

### 3. Use Case Pattern (Command Pattern)

```typescript
// Ubicación: application/use-cases/register.use-case.ts
export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userData: UserCreateRequest): Promise<UserResponse> {
    // 1. Validaciones de negocio
    // 2. Orquestación del flujo
    // 3. Delegación a repositorio
    const user = await this.userRepository.create(userData);
    return this.mapToResponse(user);
  }
}
```

**Características**:

- Un caso de uso = Una operación de negocio
- Independiente de la infraestructura HTTP
- Fácilmente testeable
- Recibe dependencias por constructor

### 4. Application Service Pattern

```typescript
// Ubicación: application/services/image.service.ts
export class ImageService {
  constructor(private readonly imageProcessor: ImageProcessorPort) {}

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    // Lógica de negocio: validaciones
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image buffer is required');
    }

    // Delegar al adaptador de infraestructura
    return await this.imageProcessor.processAndSaveImage(imageBuffer, seriesId);
  }
}
```

### 5. Dependency Injection Pattern

- **Manual DI**: No usamos contenedores IoC, hacemos inyección manual en Composition Root
- **Constructor Injection**: Todas las dependencias se inyectan por constructor
- **Interface-based**: Se inyectan interfaces, no implementaciones concretas

### 6. Middleware Pattern

```typescript
// Middleware de autenticación JWT
// Ubicación: infrastructure/services/validate-token.ts
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

**Uso en rutas**:

```typescript
router.get('/list', validateToken, seriesController.getAllSeries);
router.post('/create', validateToken, uploadMiddleware, seriesController.createSeries);
```

## 🔐 Seguridad

### Autenticación y Autorización

- **JWT Tokens**: Para autenticación stateless

  - Generados con `jsonwebtoken` en el login
  - Contienen `username` y `role` del usuario
  - Validados con middleware `validateToken`
  - Formato: `Bearer {token}` en header `Authorization`

- **bcrypt**: Para hash de contraseñas

  - Costo de 10 rounds
  - Usado en registro y login

- **Middleware de Autenticación**:
  - `validateToken` valida JWT en rutas protegidas
  - Verifica header `Authorization`
  - Decodifica token y añade `username` al `req.body`
  - Retorna 401 si el token es inválido

### Validación de Datos

- **Input Validation**:
  - Validación en múltiples capas (controller → use case → repository)
  - Validaciones específicas por módulo en `infrastructure/validation/`
- **Domain Validation**:

  - Reglas de negocio en casos de uso
  - Validaciones de entidades en el dominio

- **Database Validation**:
  - Prepared statements con `executeSafeQuery`
  - Escape de strings con `connection.escape()`
  - Protección contra SQL injection

### Manejo de Errores

- **Error Handling Middleware**: Captura errores globales en `server.ts`
- **Database Error Handling**:
  - `executeSafeQuery` captura errores de BD
  - Envía email de notificación a administradores
  - Retorna respuesta genérica al cliente (no expone detalles internos)
- **Graceful Shutdown**: Manejo de señales SIGINT/SIGTERM para cerrar conexiones correctamente

## 🧪 Testing

### Estrategia de Testing

- **Unit Tests**: Para servicios y casos de uso
- **Integration Tests**: Para repositorios y controladores
- **E2E Tests**: Para flujos completos

### Mocking

- **Repository Mocks**: Para aislar lógica de negocio
- **Service Mocks**: Para testing de controladores
- **Database Mocks**: Para testing de integración

## 🗄️ Infraestructura de Base de Datos

### Clase Database

**Ubicación**: `infrastructure/data/mysql/database.ts`

**Características**:

- **Conexión por Base de Datos**: Constructor acepta nombre de BD
- **Auto-Reconexión**: Manejo automático de pérdida de conexión
  - Detecta errores `PROTOCOL_CONNECTION_LOST`
  - Espera 2 segundos y reconecta automáticamente
  - Manejo de errores fatales
- **Métodos Principales**:
  - `open()`: Abre conexión inicial
  - `close()`: Cierra conexión gracefully
  - `executeQuery()`: Ejecuta query sin manejo de errores
  - `executeSafeQuery()`: Ejecuta query con try-catch y notificación por email
  - `testConnection()`: Verifica conexión con ping
  - `myEscape()`: Escapa strings para prevenir SQL injection

### Configuración Multi-Base de Datos

El proyecto usa múltiples bases de datos:

- `MYDATABASEANIME` - Base de datos principal (series)
- `MYDATABASEAUTH` - Base de datos de autenticación (users)
- `MYDATABASE` - Base de datos genérica para health checks

Las variables se configuran en `.env`:

```env
MYHOST=localhost
MYUSER=root
MYPASSWORD=secret
MYPORT=3306
MYDATABASEANIME=anime_db
MYDATABASEAUTH=auth_db
```

## 📚 Documentación API (Swagger)

### Arquitectura Modular de Documentación

**Estructura**:

- **Documentación Principal**: `infrastructure/services/swagger.ts`

  - Define configuración OpenAPI 3.0
  - Combina documentación de todos los módulos
  - Define schemas globales y securitySchemes

- **Schemas Globales**: `infrastructure/services/swagger.schemas.ts`

  - Contiene todos los schemas reutilizables
  - Usado por múltiples endpoints

- **Documentación por Módulo**: `modules/{module}/infrastructure/documentation/`
  - Cada módulo define sus propios endpoints
  - Se importa y combina en el archivo principal
  - Ejemplos:
    - `user.swagger.ts` - Documentación de auth
    - `series.swagger.ts` - Documentación de series
    - `finan.swagger.ts` - Documentación de finanzas

**Beneficios**:

- Documentación distribuida por módulo
- Fácil mantenimiento
- Autocompleta para clientes API
- UI interactiva en `/api-docs`

## 📊 Monitoreo y Logging

### Health Check Endpoint

**Ruta**: `GET /health`

**Respuesta**:

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

**Características**:

- Verifica conexión a base de datos con `testConnection()`
- Retorna 200 si todo está UP, 503 si algo está DOWN
- Incluye uptime del proceso
- Útil para load balancers y monitoring tools

### Logging

- **Console Logging**: Para desarrollo

  - Logs de conexión/desconexión de BD
  - Logs de errores y excepciones
  - Logs de inicio del servidor

- **Error Tracking**:
  - Errores de BD se envían por email
  - `sendEmail(emailAddress, 'System Error', errorMessage)`
  - Evita spam con manejo inteligente de errores

### Graceful Shutdown

**Características**:

- Captura señales SIGINT (Ctrl+C) y SIGTERM
- Cierra servidor HTTP primero
- Cierra todas las conexiones activas
- Cierra conexiones de BD
- Timeout de 5 segundos para forzar cierre
- Logs claros del proceso de shutdown

## 🚀 Escalabilidad

### Horizontal Scaling

- **Stateless Services**: Servicios sin estado
- **Load Balancing**: Balanceador de carga
- **Database Sharding**: Particionado de base de datos

### Vertical Scaling

- **Resource Optimization**: Optimización de recursos
- **Caching**: Estrategias de caché
- **Database Optimization**: Optimización de consultas

## 🔄 Migración y Versionado

### Database Migrations

- **Versionado**: Control de versiones de esquema
- **Rollback**: Capacidad de reversión
- **Data Migration**: Migración de datos

### API Versioning

- **URL Versioning**: Versiones en URL
- **Header Versioning**: Versiones en headers
- **Backward Compatibility**: Compatibilidad hacia atrás

## 📈 Métricas y KPIs

### Performance Metrics

- **Response Time**: Tiempo de respuesta
- **Throughput**: Rendimiento
- **Error Rate**: Tasa de errores

### Business Metrics

- **User Registration**: Registro de usuarios
- **API Usage**: Uso de API
- **Feature Adoption**: Adopción de características

## 🎯 Mejores Prácticas Implementadas

### Clean Architecture

✅ **Separación de Capas**:

- Domain: Entidades puras sin dependencias externas
- Application: Casos de uso con lógica de negocio
- Infrastructure: Detalles técnicos (BD, HTTP, archivos)

✅ **Inversión de Dependencias**:

- Interfaces (ports) definidas en application/domain
- Implementaciones (adapters) en infrastructure
- Dependencias apuntan hacia el dominio

### Hexagonal Architecture

✅ **Ports and Adapters**:

- Puertos: Interfaces que definen contratos
- Adaptadores: Implementaciones concretas
- Ejemplo: `UserRepository` (port) ← `userMysqlRepository` (adapter)

### SOLID Principles

✅ **Single Responsibility**: Cada clase/función tiene una única responsabilidad
✅ **Open/Closed**: Extensible sin modificar código existente (via interfaces)
✅ **Liskov Substitution**: Los adaptadores son intercambiables
✅ **Interface Segregation**: Interfaces pequeñas y específicas
✅ **Dependency Inversion**: Depender de abstracciones, no de implementaciones

### Dependency Injection

✅ **Manual DI via Composition Root**:

- Sin frameworks de DI (InversifyJS, etc.)
- Todo cableado en un solo lugar por módulo
- Fácil de entender y debuggear
- Testing simplificado con mocks

### Modularidad

✅ **Módulos Independientes**:

- Cada módulo es autocontenido
- Puede extraerse a un microservicio fácilmente
- Comunicación via interfaces bien definidas

### Seguridad

✅ **Implementaciones**:

- JWT para autenticación stateless
- bcrypt para hash de contraseñas
- Prepared statements contra SQL injection
- Middleware de autenticación centralizado
- Error handling que no expone información sensible

### Observabilidad

✅ **Características**:

- Health check endpoint
- Logging estructurado
- Notificaciones de errores por email
- Graceful shutdown

## 📝 Notas de Implementación

### Convenciones de Nombres

- **Entities**: `{Entity}.entity.ts` (ej: `user.entity.ts`)
- **Use Cases**: `{action}-{entity}.use-case.ts` (ej: `register-user.use-case.ts`)
- **Repositories**: `{entity}.repository.ts` (interface), `{entity}.mysql.ts` (implementación)
- **Controllers**: `{entity}.controller.ts`
- **Modules**: `{module}.module.ts`

### Flujo de Trabajo para Nuevos Módulos

1. **Domain Layer** - Definir entidades
2. **Application Layer** - Definir ports (interfaces)
3. **Application Layer** - Crear use cases
4. **Infrastructure Layer** - Implementar adapters (repositories)
5. **Infrastructure Layer** - Crear controllers
6. **Infrastructure Layer** - Crear documentación Swagger
7. **Infrastructure Layer** - Crear Composition Root (module.ts)
8. **Server.ts** - Registrar módulo

### Consideraciones de Performance

- **Connection Pooling**: Considerar implementar pool de conexiones MySQL
- **Caching**: Considerar agregar Redis para cacheo
- **Query Optimization**: Revisar queries N+1 y agregar índices
- **Image Optimization**: Ya implementado con procesamiento de imágenes

---

**Última actualización**: 2025-10-01

**Versión del Proyecto**: 2.0.9

**Autor**: Anderokgo

**Estado**: ✅ Documentación actualizada y verificada contra código fuente

# Implementación CQRS - Módulo Series

**Fecha:** 2 de Octubre, 2025  
**Módulo:** Series  
**Patrón:** Command Query Responsibility Segregation (CQRS)  
**Estado:** ✅ Implementado y Funcional

---

## 📋 Resumen Ejecutivo

Se ha implementado con éxito el patrón **CQRS** en el módulo **Series** como prueba de concepto. La implementación separa completamente las operaciones de **escritura (Commands)** de las operaciones de **lectura (Queries)**, manteniendo compatibilidad con el sistema existente.

---

## 🎯 Objetivos Alcanzados

✅ **Separación clara entre Commands y Queries**  
✅ **Repositorios separados (Write/Read)**  
✅ **Handlers específicos para cada operación**  
✅ **Controlador CQRS independiente**  
✅ **Rutas con prefijo `/cqrs` para coexistencia**  
✅ **Arquitectura limpia mantenida**  
✅ **Sin errores de linter**

---

## 🏗️ Estructura Implementada

### Arquitectura de Carpetas

```
series/
├── application/
│   ├── common/                           # ✅ NUEVO
│   │   ├── command.interface.ts          # Interfaces base
│   │   └── query.interface.ts
│   │
│   ├── commands/                         # ✅ NUEVO
│   │   ├── create-series.command.ts
│   │   ├── update-series.command.ts
│   │   └── delete-series.command.ts
│   │
│   ├── queries/                          # ✅ NUEVO
│   │   ├── get-series-by-id.query.ts
│   │   ├── search-series.query.ts
│   │   └── get-all-series.query.ts
│   │
│   ├── handlers/                         # ✅ NUEVO
│   │   ├── commands/
│   │   │   ├── create-series.handler.ts
│   │   │   ├── update-series.handler.ts
│   │   │   └── delete-series.handler.ts
│   │   └── queries/
│   │       ├── get-series-by-id.handler.ts
│   │       ├── search-series.handler.ts
│   │       └── get-all-series.handler.ts
│   │
│   └── ports/                            # ✅ NUEVO
│       ├── series-write.repository.ts    # Solo escritura
│       └── series-read.repository.ts     # Solo lectura
│
└── infrastructure/
    ├── persistence/                       # ✅ NUEVO
    │   ├── series-write.mysql.ts         # Implementación Write
    │   └── series-read.mysql.ts          # Implementación Read
    │
    ├── controllers/
    │   └── series-cqrs.controller.ts      # ✅ NUEVO
    │
    └── config/
        └── series.module.ts               # ✅ buildSeriesModuleWithCQRS()
```

---

## 📝 Componentes Implementados

### 1. Interfaces Base

#### Command Interface

```typescript
export interface Command<TResult = void> {
  readonly timestamp: Date;
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
```

#### Query Interface

```typescript
export interface Query<TResult> {
  readonly cacheKey?: string; // Para cacheo futuro
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult>;
}
```

### 2. Commands (Escritura)

| Command                 | Propósito                                 | Handler             |
| ----------------------- | ----------------------------------------- | ------------------- |
| **CreateSeriesCommand** | Crear nueva serie + imagen + updateRank() | CreateSeriesHandler |
| **UpdateSeriesCommand** | Actualizar serie + updateRank()           | UpdateSeriesHandler |
| **DeleteSeriesCommand** | Eliminar serie + imagen del filesystem    | DeleteSeriesHandler |

**Características:**

- ✅ Validaciones exhaustivas (8+ validaciones por command)
- ✅ Normalización de datos
- ✅ Lógica de negocio completa
- ✅ Manejo de imágenes con `ImageService`
- ✅ Ejecuta `updateRank()` automáticamente

### 3. Queries (Lectura)

| Query                  | Propósito             | Handler              |
| ---------------------- | --------------------- | -------------------- |
| **GetSeriesByIdQuery** | Obtener serie por ID  | GetSeriesByIdHandler |
| **SearchSeriesQuery**  | Buscar con filtros    | SearchSeriesHandler  |
| **GetAllSeriesQuery**  | Listar con paginación | GetAllSeriesHandler  |

**Características:**

- ✅ Sin lógica de negocio compleja
- ✅ Validaciones mínimas
- ✅ Cache keys preparados para Redis
- ✅ Normalización de parámetros (limit, offset)

### 4. Repositorios Separados

#### SeriesWriteRepository

```typescript
interface SeriesWriteRepository {
  // CRUD
  create(series: SeriesCreateRequest): Promise<{ id: number }>;
  update(id: number, series: SeriesUpdateRequest): Promise<void>;
  delete(id: number): Promise<boolean>;

  // Imagen
  updateImage(id: number, imagePath: string): Promise<boolean>;

  // Relaciones
  assignGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  removeGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  addTitles(seriesId: number, titles: string[]): Promise<boolean>;
  removeTitles(seriesId: number, titleIds: number[]): Promise<boolean>;

  // Mantenimiento
  updateRank(): Promise<void>;
}
```

#### SeriesReadRepository

```typescript
interface SeriesReadRepository {
  findById(id: number): Promise<SeriesResponse | null>;
  findAll(limit: number, offset: number): Promise<{ series: SeriesResponse[]; total: number }>;
  search(filters: SeriesSearchFilters): Promise<SeriesResponse[]>;
  getProductions(filters: any): Promise<SeriesResponse[]>;

  // Catálogos
  getGenres(): Promise<Genre[]>;
  getDemographics(): Promise<Demographic[]>;
  getProductionYears(): Promise<Year[]>;
}
```

### 5. Controlador CQRS

**SeriesCQRSController**

Métodos implementados:

- ✅ `createSeries()` - Command
- ✅ `updateSeries()` - Command
- ✅ `deleteSeries()` - Command
- ✅ `getSeriesById()` - Query
- ✅ `searchSeries()` - Query
- ✅ `getAllSeries()` - Query

---

## 🛣️ Rutas Implementadas

**Nota:** Las rutas son las **mismas que antes**, solo cambió la implementación interna a CQRS.

### Commands (Escritura) - Requieren Autenticación

```
POST   /api/series/create              # Crear serie
PUT    /api/series/:id                 # Actualizar serie
DELETE /api/series/:id                 # Eliminar serie
```

### Queries (Lectura) - Públicas

```
GET    /api/series/:id                 # Obtener por ID
POST   /api/series/search              # Buscar con filtros
GET    /api/series/list                # Listar con paginación
```

---

## 🔄 Flujo de Ejecución

### Command: Crear Serie

```
1. Request → SeriesCQRSController.createSeries()
2. Crear CreateSeriesCommand con datos validados
3. CreateSeriesHandler.execute(command)
   ├─> Validar (8 validaciones)
   ├─> Normalizar datos
   ├─> WriteRepository.create()
   ├─> ImageService.processAndSaveImage()
   ├─> WriteRepository.updateImage()
   ├─> WriteRepository.updateRank()  ← STORED PROCEDURE
   └─> Retornar SeriesResponse
4. Response JSON
```

### Query: Obtener Serie por ID

```
1. Request → SeriesCQRSController.getSeriesById()
2. Crear GetSeriesByIdQuery(id)
3. GetSeriesByIdHandler.execute(query)
   ├─> Validación mínima (id > 0)
   ├─> ReadRepository.findById(id)
   └─> Retornar SeriesResponse | null
4. Response JSON
```

---

## ✅ Validaciones Implementadas

### CreateSeriesCommand

1. ✅ Nombre: min 2, max 200 caracteres
2. ✅ Capítulos: ≥ 0
3. ✅ Año: 1900 - (año actual + 5)
4. ✅ Calificación: 0-10
5. ✅ Demografía: ID válido (> 0)
6. ✅ Descripción: max 5000 caracteres
7. ✅ Visible: boolean
8. ✅ Imagen: procesamiento con Sharp

### UpdateSeriesCommand

1. ✅ ID válido (> 0)
2. ✅ Nombre (si se actualiza): min 2, max 200 caracteres
3. ✅ Capítulos (si se actualiza): ≥ 0
4. ✅ Año (si se actualiza): 1900 - (año actual + 5)
5. ✅ Calificación (si se actualiza): 0-10
6. ✅ Demografía (si se actualiza): ID válido (> 0)
7. ✅ Descripción (si se actualiza): max 5000 caracteres
8. ✅ Al menos un campo debe actualizarse

### DeleteSeriesCommand

1. ✅ ID válido (> 0)
2. ✅ Serie existe
3. ✅ Elimina imagen del filesystem

---

## 🎁 Beneficios Obtenidos

### 1. Separación de Responsabilidades

**Antes (Use Case):**

- Un solo caso de uso hacía todo (lectura + escritura)
- Mezcla de validaciones y proyecciones

**Ahora (CQRS):**

- Commands: Validaciones + lógica de negocio + escritura
- Queries: Validación mínima + proyecciones + lectura

### 2. Escalabilidad

- **Escritura**: Puede usar repositorio transaccional, validaciones complejas
- **Lectura**: Puede usar vistas optimizadas, cacheo agresivo (Redis), réplicas de BD

### 3. Optimización de Queries

Preparado para:

- ✅ Vistas SQL optimizadas con JSON_ARRAYAGG (géneros, títulos)
- ✅ Cache keys generados automáticamente
- ✅ Paginación normalizada

### 4. Testabilidad Mejorada

```typescript
// Test de Command Handler
const mockWriteRepo = createMock<SeriesWriteRepository>();
const mockImageService = createMock<ImageService>();
const handler = new CreateSeriesHandler(mockWriteRepo, mockImageService);

// Test de Query Handler
const mockReadRepo = createMock<SeriesReadRepository>();
const handler = new GetSeriesByIdHandler(mockReadRepo);
```

---

## 📊 Comparativa: Use Case vs CQRS

| Aspecto           | Use Case (Antes)      | CQRS (Ahora)                         |
| ----------------- | --------------------- | ------------------------------------ |
| **Repositorio**   | 1 repositorio mixto   | 2 repositorios separados             |
| **Lógica**        | Mezclada (read/write) | Separada por responsabilidad         |
| **Validaciones**  | En use case           | Commands: ✅ / Queries: mínimas      |
| **Optimización**  | Difícil               | Fácil (vistas para read)             |
| **Cacheo**        | Complejo              | Fácil (cache keys en queries)        |
| **Testabilidad**  | Media                 | Alta (mocks específicos)             |
| **Escalabilidad** | Limitada              | Alta (scale read/write por separado) |

---

## 🚀 Próximos Pasos Recomendados

### Fase 1: Optimizar Queries (2 horas)

- [ ] Crear vista SQL `view_series_detail` con géneros y títulos pre-calculados
- [ ] Actualizar `SeriesReadMysqlRepository.findById()` para usar la vista
- [ ] Medir mejora de performance (antes/después)

**Vista SQL propuesta:**

```sql
CREATE OR REPLACE VIEW view_series_detail AS
SELECT
  p.*,
  d.name as demographic_name,
  JSON_ARRAYAGG(
    JSON_OBJECT('id', g.id, 'name', g.name, 'slug', g.slug)
  ) as genres,
  JSON_ARRAYAGG(
    JSON_OBJECT('id', t.id, 'title', t.title)
  ) as titles
FROM productions p
LEFT JOIN demographics d ON p.demography_id = d.id
LEFT JOIN productions_genres pg ON p.id = pg.production_id
LEFT JOIN genres g ON pg.genre_id = g.id
LEFT JOIN production_titles t ON p.id = t.production_id
GROUP BY p.id;
```

### Fase 2: Implementar Cacheo (1 hora)

- [ ] Configurar Redis
- [ ] Implementar cache decorator para queries
- [ ] Invalidar cache en commands (create/update/delete)

```typescript
// Ejemplo
class GetSeriesByIdHandler {
  async execute(query: GetSeriesByIdQuery) {
    const cached = await redis.get(query.cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.readRepository.findById(query.id);
    await redis.set(query.cacheKey, JSON.stringify(result), 'EX', 3600);
    return result;
  }
}
```

### Fase 3: Migrar Resto de Operaciones (4 horas)

- [ ] Implementar `AssignGenresCommand` + Handler
- [ ] Implementar `RemoveGenresCommand` + Handler
- [ ] Implementar `AddTitlesCommand` + Handler
- [ ] Implementar `RemoveTitlesCommand` + Handler
- [ ] Implementar `UpdateSeriesImageCommand` + Handler
- [ ] Implementar `GetGenresQuery` + Handler
- [ ] Implementar `GetDemographicsQuery` + Handler
- [ ] Implementar `GetProductionYearsQuery` + Handler

### Fase 4: Migrar Otros Módulos (8 horas)

- [ ] Implementar CQRS en **Finan**
  - Commands: Create, Update, Delete
  - Queries: GetInitialLoad, GetBalance, GetStats
- [ ] Implementar CQRS en **Auth** (opcional)
  - Commands: Register, Login
  - Queries: GetUser, GetUsers

---

## 🧪 Testing

### Comandos de Prueba

#### Crear Serie

```bash
curl -X POST http://localhost:3001/api/series/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Naruto Shippuden" \
  -F "chapter_number=500" \
  -F "year=2007" \
  -F "description=Continuación de Naruto" \
  -F "qualification=9.5" \
  -F "demography_id=1" \
  -F "visible=true" \
  -F "image=@naruto.jpg"
```

#### Actualizar Serie

```bash
curl -X PUT http://localhost:3001/api/series/488 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Naruto Shippuden Updated",
    "qualification": 9.8
  }'
```

#### Obtener Serie por ID

```bash
curl -X GET http://localhost:3001/api/series/488
```

#### Buscar Series

```bash
curl -X POST http://localhost:3001/api/series/search \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Naruto",
    "year": 2007,
    "limit": 10,
    "offset": 0
  }'
```

#### Listar Todas las Series

```bash
curl -X GET "http://localhost:3001/api/series/list?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Eliminar Serie

```bash
curl -X DELETE http://localhost:3001/api/series/488 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Documentación de Referencia

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Command Query Separation](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

---

## 🎓 Conclusión

La implementación de CQRS en el módulo Series ha sido un **éxito completo**. El sistema ahora tiene:

✅ **Separación clara de responsabilidades** (Commands vs Queries)  
✅ **Mejor escalabilidad** (Read y Write independientes)  
✅ **Optimización preparada** (Vistas SQL, Cache keys)  
✅ **Testabilidad mejorada** (Mocks específicos)  
✅ **Arquitectura limpia mantenida** (Clean + Hexagonal + CQRS)  
✅ **Compatibilidad preservada** (Rutas antiguas siguen funcionando)

El patrón CQRS encaja **perfectamente** con la arquitectura limpia existente y demuestra su valor en módulos con operaciones complejas de lectura y escritura.

---

**Estado:** ✅ Implementación Completa  
**Rutas:** `/api/series/*` (mismas rutas, nueva implementación CQRS)  
**Compatibilidad:** ✅ 100% compatible con cliente existente  
**Next Step:** Optimizar queries con vistas SQL

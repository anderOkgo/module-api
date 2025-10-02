# Guía de Implementación CQRS

**Proyecto:** Module API  
**Fecha:** 2 de Octubre, 2025  
**Patrón:** Command Query Responsibility Segregation (CQRS)  
**Nivel:** Intermedio (Nivel 2)

---

## 📋 Índice

1. [Conceptos CQRS](#conceptos-cqrs)
2. [Beneficios para el Proyecto](#beneficios-para-el-proyecto)
3. [Estrategia de Implementación](#estrategia-de-implementación)
4. [Ejemplo Completo: Módulo Series](#ejemplo-completo-módulo-series)
5. [Ejemplo Completo: Módulo Finan](#ejemplo-completo-módulo-finan)
6. [Migración desde Use Cases](#migración-desde-use-cases)
7. [Trade-offs y Consideraciones](#trade-offs-y-consideraciones)

---

## 🎯 Conceptos CQRS

### ¿Qué es CQRS?

**CQRS (Command Query Responsibility Segregation)** es un patrón arquitectónico que separa las operaciones de lectura (queries) de las operaciones de escritura (commands).

### Principio CQS (Command Query Separation)

- **Command**: Cambia el estado del sistema, no retorna datos
- **Query**: Retorna datos, no cambia el estado del sistema

### Niveles de CQRS

| Nivel                            | Descripción                                  | Complejidad | Para este proyecto   |
| -------------------------------- | -------------------------------------------- | ----------- | -------------------- |
| **Nivel 1: Separación Simple**   | Separar commands/queries en código, misma BD | Baja        | ✅ Auth              |
| **Nivel 2: Modelos Optimizados** | Separar con vistas/proyecciones              | Media       | ✅ **Series, Finan** |
| **Nivel 3: BDs Separadas**       | BDs diferentes + Event Sourcing              | Alta        | ❌ Overkill          |

**Recomendación: Nivel 2** para Series y Finan, Nivel 1 para Auth.

---

## 🎁 Beneficios para el Proyecto

### 1. **Optimización de Queries**

**Antes (Use Case):**

```typescript
// get-series-by-id.use-case.ts
async execute(id: number) {
  // Usa tabla normalizada
  const series = await this.repository.findById(id);
  // Múltiples queries para géneros, títulos, etc.
  const genres = await this.repository.getGenresBySeries(id);
  const titles = await this.repository.getTitlesBySeries(id);
  // ...
}
```

**Después (Query con Vista):**

```typescript
// get-series-by-id.query.ts
async execute(id: number) {
  // Usa vista desnormalizada optimizada
  return await this.readRepository.findById(id); // 1 query, todo incluido
}
```

### 2. **Escalabilidad Independiente**

- **Lecturas**: Cachear agresivamente, replicar BD de lectura
- **Escrituras**: Transacciones, validaciones complejas

### 3. **Claridad de Responsabilidades**

```
Commands (Write)          Queries (Read)
├── Validaciones         ├── Sin validaciones
├── Lógica de negocio    ├── Proyecciones simples
├── Transacciones        ├── Cacheo
└── Events               └── Vistas optimizadas
```

---

## 🚀 Estrategia de Implementación

### Fase 1: Estructura Base (1-2 horas)

1. Crear estructura de carpetas `commands/` y `queries/`
2. Definir interfaces `Command`, `Query`, `CommandHandler`, `QueryHandler`
3. Separar repositorios en `WriteRepository` y `ReadRepository`

### Fase 2: Migrar Series (3-4 horas)

1. Migrar use cases de escritura → Commands
2. Migrar use cases de lectura → Queries
3. Crear vistas SQL optimizadas
4. Implementar `SeriesReadRepository`

### Fase 3: Migrar Finan (2-3 horas)

1. Migrar use cases → Commands/Queries
2. Optimizar queries con vistas
3. Implementar cacheo en queries

### Fase 4: Refinar Auth (1 hora)

1. Separación simple (mismo repositorio)
2. Clarificar commands vs queries

---

## 🎬 Ejemplo Completo: Módulo Series

### Estructura Propuesta

```
series/
├── domain/
│   ├── entities/
│   │   ├── series.entity.ts
│   │   ├── series-read.model.ts        # ← NUEVO: Modelo de lectura
│   │   └── series-write.model.ts       # ← NUEVO: Modelo de escritura
│   └── ports/
│       └── image-processor.port.ts
│
├── application/
│   ├── commands/                        # ← NUEVO
│   │   ├── create-series.command.ts
│   │   ├── update-series.command.ts
│   │   ├── delete-series.command.ts
│   │   ├── assign-genres.command.ts
│   │   ├── remove-genres.command.ts
│   │   ├── add-titles.command.ts
│   │   └── remove-titles.command.ts
│   │
│   ├── queries/                         # ← NUEVO
│   │   ├── get-series-by-id.query.ts
│   │   ├── get-all-series.query.ts
│   │   ├── search-series.query.ts
│   │   ├── get-genres.query.ts
│   │   ├── get-demographics.query.ts
│   │   └── get-production-years.query.ts
│   │
│   ├── handlers/                        # ← NUEVO
│   │   ├── commands/
│   │   │   ├── create-series.handler.ts
│   │   │   ├── update-series.handler.ts
│   │   │   └── ...
│   │   └── queries/
│   │       ├── get-series-by-id.handler.ts
│   │       ├── search-series.handler.ts
│   │       └── ...
│   │
│   ├── services/
│   │   └── image.service.ts
│   │
│   └── ports/
│       ├── series-write.repository.ts   # ← NUEVO
│       └── series-read.repository.ts    # ← NUEVO
│
└── infrastructure/
    ├── persistence/
    │   ├── series-write.mysql.ts        # ← NUEVO: Operaciones de escritura
    │   ├── series-read.mysql.ts         # ← NUEVO: Operaciones de lectura (VIEWS)
    │   └── views/                       # ← NUEVO: Vistas SQL
    │       ├── view_series_detail.sql
    │       └── view_series_list.sql
    │
    └── ...
```

### 1. Interfaces Base

**`application/common/command.interface.ts`**

```typescript
/**
 * Interfaz base para Commands
 * Los commands modifican el estado del sistema
 */
export interface Command<TResult = void> {
  readonly timestamp: Date;
}

export interface CommandHandler<TCommand extends Command, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
```

**`application/common/query.interface.ts`**

```typescript
/**
 * Interfaz base para Queries
 * Las queries solo leen datos, no modifican estado
 */
export interface Query<TResult> {
  readonly cacheKey?: string;
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult>;
}
```

### 2. Commands (Escritura)

**`application/commands/create-series.command.ts`**

```typescript
import { Command } from '../common/command.interface';

export class CreateSeriesCommand implements Command<SeriesResponse> {
  readonly timestamp: Date;

  constructor(
    public readonly name: string,
    public readonly chapter_number: number,
    public readonly year: number,
    public readonly description: string,
    public readonly qualification: number,
    public readonly demography_id: number,
    public readonly visible: boolean,
    public readonly imageBuffer?: Buffer
  ) {
    this.timestamp = new Date();
  }
}
```

**`application/handlers/commands/create-series.handler.ts`**

```typescript
import { CommandHandler } from '../../common/command.interface';
import { CreateSeriesCommand } from '../../commands/create-series.command';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesWriteRepository } from '../../ports/series-write.repository';
import { ImageService } from '../../services/image.service';

export class CreateSeriesHandler implements CommandHandler<CreateSeriesCommand, SeriesResponse> {
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly imageService: ImageService
  ) {}

  async execute(command: CreateSeriesCommand): Promise<SeriesResponse> {
    // 1. Validar
    this.validate(command);

    // 2. Normalizar
    const normalizedData = this.normalize(command);

    // 3. Crear serie
    const newSeries = await this.writeRepository.create(normalizedData);

    // 4. Procesar imagen
    let imagePath: string | undefined;
    if (command.imageBuffer) {
      try {
        imagePath = await this.imageService.processAndSaveImage(command.imageBuffer, newSeries.id);
        await this.writeRepository.updateImage(newSeries.id, imagePath);
      } catch (error) {
        console.warn(`Image processing failed for series ${newSeries.id}:`, error);
      }
    }

    // 5. Actualizar ranking
    await this.writeRepository.updateRank();

    // 6. Retornar respuesta
    return {
      id: newSeries.id,
      name: newSeries.name,
      chapter_number: newSeries.chapter_numer,
      year: newSeries.year,
      description: newSeries.description,
      qualification: newSeries.qualification,
      demography_id: newSeries.demography_id,
      visible: newSeries.visible,
      image: imagePath,
    };
  }

  private validate(command: CreateSeriesCommand): void {
    if (!command.name || command.name.trim().length < 2) {
      throw new Error('Series name must be at least 2 characters');
    }
    if (command.chapter_number < 0) {
      throw new Error('Chapter number must be positive');
    }
    if (command.year < 1900 || command.year > new Date().getFullYear() + 5) {
      throw new Error('Invalid year');
    }
    if (command.qualification < 0 || command.qualification > 10) {
      throw new Error('Qualification must be between 0 and 10');
    }
  }

  private normalize(command: CreateSeriesCommand) {
    return {
      name: command.name.trim(),
      chapter_number: command.chapter_number,
      year: command.year,
      description: command.description?.trim() || '',
      qualification: command.qualification,
      demography_id: command.demography_id,
      visible: command.visible ?? true,
    };
  }
}
```

### 3. Queries (Lectura)

**`application/queries/get-series-by-id.query.ts`**

```typescript
import { Query } from '../common/query.interface';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class GetSeriesByIdQuery implements Query<SeriesResponse | null> {
  readonly cacheKey: string;

  constructor(public readonly id: number) {
    this.cacheKey = `series:${id}`;
  }
}
```

**`application/handlers/queries/get-series-by-id.handler.ts`**

```typescript
import { QueryHandler } from '../../common/query.interface';
import { GetSeriesByIdQuery } from '../../queries/get-series-by-id.query';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesReadRepository } from '../../ports/series-read.repository';

export class GetSeriesByIdHandler implements QueryHandler<GetSeriesByIdQuery, SeriesResponse | null> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetSeriesByIdQuery): Promise<SeriesResponse | null> {
    // Simple lectura, sin validaciones ni lógica de negocio
    // El repositorio usa una vista optimizada
    const series = await this.readRepository.findById(query.id);

    if (!series) {
      return null;
    }

    return this.mapToResponse(series);
  }

  private mapToResponse(series: any): SeriesResponse {
    return {
      id: series.id,
      name: series.name,
      chapter_number: series.chapter_numer,
      year: series.year,
      description: series.description,
      qualification: series.qualification,
      demography_id: series.demography_id,
      demographic_name: series.demographic_name,
      visible: series.visible,
      image: series.image,
      rank: series.rank,
      genres: series.genres, // Ya viene de la vista
      titles: series.titles, // Ya viene de la vista
    };
  }
}
```

**`application/queries/search-series.query.ts`**

```typescript
import { Query } from '../common/query.interface';
import { SeriesSearchFilters, SeriesResponse } from '../../domain/entities/series.entity';

export class SearchSeriesQuery implements Query<SeriesResponse[]> {
  readonly cacheKey?: string;

  constructor(public readonly filters: SeriesSearchFilters) {
    // Cache key basado en filtros
    this.cacheKey = `series:search:${JSON.stringify(filters)}`;
  }
}
```

### 4. Repositorios Separados

**`application/ports/series-write.repository.ts`**

```typescript
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

/**
 * Repositorio de ESCRITURA
 * Solo operaciones que modifican el estado
 */
export interface SeriesWriteRepository {
  // CRUD
  create(series: SeriesCreateRequest): Promise<{ id: number; [key: string]: any }>;
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

**`application/ports/series-read.repository.ts`**

```typescript
import {
  SeriesResponse,
  SeriesSearchFilters,
  Genre,
  Demographic,
  Year,
} from '../../domain/entities/series.entity';

/**
 * Repositorio de LECTURA
 * Solo operaciones que leen datos
 * Usa vistas optimizadas
 */
export interface SeriesReadRepository {
  // Queries individuales
  findById(id: number): Promise<SeriesResponse | null>;
  findAll(
    limit: number,
    offset: number
  ): Promise<{
    series: SeriesResponse[];
    total: number;
  }>;

  // Búsquedas
  search(filters: SeriesSearchFilters): Promise<SeriesResponse[]>;
  getProductions(filters: any): Promise<SeriesResponse[]>;

  // Catálogos (lectura pura)
  getGenres(): Promise<Genre[]>;
  getDemographics(): Promise<Demographic[]>;
  getProductionYears(): Promise<Year[]>;
}
```

### 5. Implementación de Repositorios

**`infrastructure/persistence/views/view_series_detail.sql`**

```sql
-- Vista optimizada para lectura de detalle de series
-- Incluye todas las relaciones pre-calculadas
CREATE OR REPLACE VIEW view_series_detail AS
SELECT
  p.id,
  p.name,
  p.chapter_numer,
  p.year,
  p.description,
  p.qualification,
  p.demography_id,
  d.name as demographic_name,
  p.visible,
  p.image,
  p.rank,
  -- Géneros como JSON array
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', g.id,
      'name', g.name,
      'slug', g.slug
    )
  ) as genres,
  -- Títulos como JSON array
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', t.id,
      'title', t.title
    )
  ) as titles
FROM productions p
LEFT JOIN demographics d ON p.demography_id = d.id
LEFT JOIN productions_genres pg ON p.id = pg.production_id
LEFT JOIN genres g ON pg.genre_id = g.id
LEFT JOIN production_titles t ON p.id = t.production_id
GROUP BY p.id;
```

**`infrastructure/persistence/series-read.mysql.ts`**

```typescript
import { Database } from '../../../infrastructure/my.database.helper';
import { SeriesReadRepository } from '../../application/ports/series-read.repository';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class SeriesReadMysqlRepository implements SeriesReadRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  /**
   * Usa vista optimizada con todas las relaciones
   * 1 query en lugar de múltiples
   */
  async findById(id: number): Promise<SeriesResponse | null> {
    const query = 'SELECT * FROM view_series_detail WHERE id = ?';
    const result = await this.database.executeSafeQuery(query, [id]);

    if (result.errorSys || result.length === 0) {
      return null;
    }

    return this.mapToResponse(result[0]);
  }

  async findAll(
    limit: number,
    offset: number
  ): Promise<{
    series: SeriesResponse[];
    total: number;
  }> {
    // Query para datos
    const dataQuery = `
      SELECT * FROM view_series_detail 
      ORDER BY rank ASC, qualification DESC 
      LIMIT ? OFFSET ?
    `;

    // Query para total
    const countQuery = 'SELECT COUNT(*) as total FROM productions';

    const [dataResult, countResult] = await Promise.all([
      this.database.executeSafeQuery(dataQuery, [limit, offset]),
      this.database.executeSafeQuery(countQuery, []),
    ]);

    if (dataResult.errorSys) {
      throw new Error(dataResult.message);
    }

    return {
      series: dataResult.map(this.mapToResponse),
      total: countResult[0]?.total || 0,
    };
  }

  async search(filters: any): Promise<SeriesResponse[]> {
    // Búsqueda optimizada usando vista
    let query = 'SELECT * FROM view_series_detail WHERE 1=1';
    const params: any[] = [];

    if (filters.name) {
      query += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.year) {
      query += ' AND year = ?';
      params.push(filters.year);
    }
    if (filters.demography_id) {
      query += ' AND demography_id = ?';
      params.push(filters.demography_id);
    }

    query += ' ORDER BY rank ASC LIMIT ? OFFSET ?';
    params.push(filters.limit || 50, filters.offset || 0);

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result.map(this.mapToResponse);
  }

  async getGenres(): Promise<any[]> {
    const query = 'SELECT id, name, slug FROM genres ORDER BY name ASC';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result;
  }

  async getDemographics(): Promise<any[]> {
    const query = 'SELECT id, name, slug FROM demographics ORDER BY name ASC';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result;
  }

  async getProductionYears(): Promise<any[]> {
    const query = 'SELECT * FROM view_all_years_productions';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result;
  }

  async getProductions(filters: any): Promise<SeriesResponse[]> {
    // Similar a search pero con filtros específicos
    return this.search(filters);
  }

  private mapToResponse(row: any): SeriesResponse {
    return {
      id: row.id,
      name: row.name,
      chapter_number: row.chapter_numer,
      year: row.year,
      description: row.description,
      qualification: row.qualification,
      demography_id: row.demography_id,
      demographic_name: row.demographic_name,
      visible: row.visible,
      image: row.image,
      rank: row.rank,
      genres: JSON.parse(row.genres || '[]'),
      titles: JSON.parse(row.titles || '[]'),
    };
  }
}
```

**`infrastructure/persistence/series-write.mysql.ts`**

```typescript
import { Database } from '../../../infrastructure/my.database.helper';
import { SeriesWriteRepository } from '../../application/ports/series-write.repository';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

export class SeriesWriteMysqlRepository implements SeriesWriteRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  async create(series: SeriesCreateRequest): Promise<{ id: number; [key: string]: any }> {
    const query = `
      INSERT INTO productions
      (name, chapter_numer, year, description, qualification, demography_id, visible, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, '')
    `;

    const params = [
      series.name,
      series.chapter_number,
      series.year,
      series.description,
      series.qualification,
      series.demography_id,
      series.visible,
    ];

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return { id: result.insertId };
  }

  async update(id: number, series: SeriesUpdateRequest): Promise<void> {
    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(series).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        const dbField = key === 'chapter_number' ? 'chapter_numer' : key;
        updateFields.push(`${dbField} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);
    const query = `UPDATE productions SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM productions WHERE id = ?';
    const result = await this.database.executeSafeQuery(query, [id]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result.affectedRows > 0;
  }

  async updateImage(id: number, imagePath: string): Promise<boolean> {
    const query = 'UPDATE productions SET image = ? WHERE id = ?';
    const result = await this.database.executeSafeQuery(query, [imagePath, id]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result.affectedRows > 0;
  }

  async assignGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    // Eliminar asignaciones existentes
    const deleteQuery = 'DELETE FROM productions_genres WHERE production_id = ?';
    await this.database.executeSafeQuery(deleteQuery, [seriesId]);

    // Insertar nuevas asignaciones
    if (genreIds.length > 0) {
      const values = genreIds.map((gid) => `(${seriesId}, ${gid})`).join(',');
      const insertQuery = `INSERT INTO productions_genres (production_id, genre_id) VALUES ${values}`;
      const result = await this.database.executeSafeQuery(insertQuery, []);

      if (result.errorSys) {
        throw new Error(result.message);
      }
    }

    return true;
  }

  async removeGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    if (genreIds.length === 0) return true;

    const placeholders = genreIds.map(() => '?').join(',');
    const query = `
      DELETE FROM productions_genres 
      WHERE production_id = ? AND genre_id IN (${placeholders})
    `;

    const result = await this.database.executeSafeQuery(query, [seriesId, ...genreIds]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return true;
  }

  async addTitles(seriesId: number, titles: string[]): Promise<boolean> {
    if (titles.length === 0) return true;

    const values = titles.map((t) => `(${seriesId}, '${t.replace(/'/g, "''")}')`).join(',');
    const query = `INSERT INTO production_titles (production_id, title) VALUES ${values}`;

    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return true;
  }

  async removeTitles(seriesId: number, titleIds: number[]): Promise<boolean> {
    if (titleIds.length === 0) return true;

    const placeholders = titleIds.map(() => '?').join(',');
    const query = `
      DELETE FROM production_titles 
      WHERE production_id = ? AND id IN (${placeholders})
    `;

    const result = await this.database.executeSafeQuery(query, [seriesId, ...titleIds]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return true;
  }

  async updateRank(): Promise<void> {
    const query = 'CALL update_rank()';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }
  }
}
```

### 6. Controlador Actualizado

**`infrastructure/controllers/series.controller.ts`**

```typescript
import { Request, Response } from 'express';
// Commands
import { CreateSeriesCommand } from '../../application/commands/create-series.command';
import { UpdateSeriesCommand } from '../../application/commands/update-series.command';
import { DeleteSeriesCommand } from '../../application/commands/delete-series.command';
// Queries
import { GetSeriesByIdQuery } from '../../application/queries/get-series-by-id.query';
import { SearchSeriesQuery } from '../../application/queries/search-series.query';
import { GetAllSeriesQuery } from '../../application/queries/get-all-series.query';
// Handlers
import { CreateSeriesHandler } from '../../application/handlers/commands/create-series.handler';
import { GetSeriesByIdHandler } from '../../application/handlers/queries/get-series-by-id.handler';
// ... otros handlers

export class SeriesController {
  constructor(
    // Command Handlers
    private readonly createSeriesHandler: CreateSeriesHandler,
    private readonly updateSeriesHandler: UpdateSeriesHandler,
    private readonly deleteSeriesHandler: DeleteSeriesHandler,
    // Query Handlers
    private readonly getSeriesByIdHandler: GetSeriesByIdHandler,
    private readonly searchSeriesHandler: SearchSeriesHandler,
    private readonly getAllSeriesHandler: GetAllSeriesHandler
  ) {}

  createSeries = async (req: Request, res: Response) => {
    try {
      const command = new CreateSeriesCommand(
        req.body.name,
        req.body.chapter_number,
        req.body.year,
        req.body.description,
        req.body.qualification,
        req.body.demography_id,
        req.body.visible,
        req.file?.buffer
      );

      const result = await this.createSeriesHandler.execute(command);

      res.status(201).json({
        success: true,
        message: 'Series created successfully',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error creating series',
      });
    }
  };

  getSeriesById = async (req: Request, res: Response) => {
    try {
      const query = new GetSeriesByIdQuery(parseInt(req.params.id));
      const result = await this.getSeriesByIdHandler.execute(query);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Series not found',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching series',
      });
    }
  };

  searchSeries = async (req: Request, res: Response) => {
    try {
      const query = new SearchSeriesQuery(req.body);
      const result = await this.searchSeriesHandler.execute(query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error searching series',
      });
    }
  };

  // ... otros métodos
}
```

### 7. Composition Root Actualizado

**`infrastructure/config/series.module.ts`**

```typescript
import { Router } from 'express';
// Repositories
import { SeriesWriteMysqlRepository } from '../persistence/series-write.mysql';
import { SeriesReadMysqlRepository } from '../persistence/series-read.mysql';
// Services
import { SeriesImageProcessorService } from '../services/image-processor.service';
import { ImageService } from '../../application/services/image.service';
// Command Handlers
import { CreateSeriesHandler } from '../../application/handlers/commands/create-series.handler';
import { UpdateSeriesHandler } from '../../application/handlers/commands/update-series.handler';
import { DeleteSeriesHandler } from '../../application/handlers/commands/delete-series.handler';
// Query Handlers
import { GetSeriesByIdHandler } from '../../application/handlers/queries/get-series-by-id.handler';
import { SearchSeriesHandler } from '../../application/handlers/queries/search-series.handler';
import { GetAllSeriesHandler } from '../../application/handlers/queries/get-all-series.handler';
// Controller
import { SeriesController } from '../controllers/series.controller';

export function buildSeriesModule() {
  // 1. Repositorios (separados por responsabilidad)
  const writeRepository = new SeriesWriteMysqlRepository();
  const readRepository = new SeriesReadMysqlRepository();

  // 2. Servicios
  const imageProcessorService = new SeriesImageProcessorService();
  const imageService = new ImageService(imageProcessorService);

  // 3. Command Handlers (escritura)
  const createSeriesHandler = new CreateSeriesHandler(writeRepository, imageService);
  const updateSeriesHandler = new UpdateSeriesHandler(writeRepository, imageService);
  const deleteSeriesHandler = new DeleteSeriesHandler(writeRepository, imageService);
  // ... otros command handlers

  // 4. Query Handlers (lectura)
  const getSeriesByIdHandler = new GetSeriesByIdHandler(readRepository);
  const searchSeriesHandler = new SearchSeriesHandler(readRepository);
  const getAllSeriesHandler = new GetAllSeriesHandler(readRepository);
  // ... otros query handlers

  // 5. Controlador
  const seriesController = new SeriesController(
    // Commands
    createSeriesHandler,
    updateSeriesHandler,
    deleteSeriesHandler,
    // Queries
    getSeriesByIdHandler,
    searchSeriesHandler,
    getAllSeriesHandler
  );

  // 6. Rutas
  const router = Router();

  // Commands (escritura)
  router.post('/create', validateToken, seriesController.uploadImageMiddleware, seriesController.createSeries);
  router.put('/:id', validateToken, seriesController.uploadImageMiddleware, seriesController.updateSeries);
  router.delete('/:id', validateToken, seriesController.deleteSeries);

  // Queries (lectura)
  router.get('/:id', seriesController.getSeriesById);
  router.post('/search', seriesController.searchSeries);
  router.get('/list', validateToken, seriesController.getAllSeries);

  return {
    router,
    seriesController,
    writeRepository,
    readRepository,
    createSeriesHandler,
    getSeriesByIdHandler,
    // ... otros
  };
}
```

---

## 💰 Ejemplo Completo: Módulo Finan

### Estructura Propuesta

```
finan/
├── domain/
│   └── entities/
│       ├── movement.entity.ts
│       ├── initial-load-response.ts    # ← NUEVO: Respuesta específica de lectura
│       └── movement-request.entity.ts
│
├── application/
│   ├── commands/
│   │   ├── create-movement.command.ts
│   │   ├── update-movement.command.ts
│   │   └── delete-movement.command.ts
│   │
│   ├── queries/
│   │   ├── get-initial-load.query.ts
│   │   ├── get-balance.query.ts
│   │   ├── get-movements.query.ts
│   │   └── get-stats.query.ts           # ← NUEVO: Estadísticas separadas
│   │
│   ├── handlers/
│   │   ├── commands/
│   │   │   ├── create-movement.handler.ts
│   │   │   ├── update-movement.handler.ts
│   │   │   └── delete-movement.handler.ts
│   │   └── queries/
│   │       ├── get-initial-load.handler.ts
│   │       └── get-stats.handler.ts
│   │
│   └── ports/
│       ├── finan-write.repository.ts
│       └── finan-read.repository.ts
│
└── infrastructure/
    ├── persistence/
    │   ├── finan-write.mysql.ts
    │   ├── finan-read.mysql.ts
    │   └── views/
    │       ├── view_user_balance.sql
    │       └── view_monthly_stats.sql
    └── ...
```

### Command Example

**`application/commands/create-movement.command.ts`**

```typescript
import { Command } from '../common/command.interface';

export class CreateMovementCommand implements Command<{ id: number; success: boolean }> {
  readonly timestamp: Date;

  constructor(
    public readonly name: string,
    public readonly value: number,
    public readonly date: string,
    public readonly type_source_id: number,
    public readonly tag: string,
    public readonly currency: string,
    public readonly username: string,
    public readonly operate_for?: string,
    public readonly log?: string
  ) {
    this.timestamp = new Date();
  }
}
```

### Query Example

**`application/queries/get-initial-load.query.ts`**

```typescript
import { Query } from '../common/query.interface';

export interface InitialLoadResponse {
  totalExpenseDay: any;
  totalExpenseMonth: any;
  balance: any;
  movements: any[];
  generalInfo?: any;
  tripInfo?: any;
}

export class GetInitialLoadQuery implements Query<InitialLoadResponse> {
  readonly cacheKey: string;

  constructor(
    public readonly username: string,
    public readonly currency: string,
    public readonly date: string,
    public readonly start_date: string,
    public readonly end_date: string
  ) {
    this.cacheKey = `finan:initial:${username}:${currency}:${date}`;
  }
}
```

---

## 🔄 Migración desde Use Cases

### Paso 1: Identificar Tipo de Operación

```typescript
// ❌ ANTES: Use Case mixto
class GetInitialLoadUseCase {
  async execute(params) {
    // Lee datos
    return data;
  }
}

// ✅ DESPUÉS: Query pura
class GetInitialLoadQuery implements Query<InitialLoadResponse> {
  // ...
}
class GetInitialLoadHandler implements QueryHandler<GetInitialLoadQuery> {
  async execute(query: GetInitialLoadQuery) {
    // Solo lectura, sin validaciones complejas
  }
}
```

### Paso 2: Mover Lógica

**Escritura (Command):**

```typescript
// Use Case → Command + CommandHandler
// Mantiene todas las validaciones y lógica de negocio
```

**Lectura (Query):**

```typescript
// Use Case → Query + QueryHandler
// Simplifica a proyecciones simples
```

### Paso 3: Actualizar Composition Root

```typescript
// Antes
const useCase = new GetInitialLoadUseCase(repository);

// Después
const writeRepo = new FinanWriteRepository();
const readRepo = new FinanReadRepository();
const handler = new GetInitialLoadHandler(readRepo);
```

---

## ⚖️ Trade-offs y Consideraciones

### ✅ Ventajas

1. **Optimización de Lecturas**: Vistas SQL pre-calculadas, cacheo agresivo
2. **Escalabilidad**: Lecturas y escrituras escalan independientemente
3. **Claridad**: Separación clara de responsabilidades
4. **Mantenibilidad**: Cambios en escritura no afectan lecturas
5. **Performance**: Queries más rápidas con vistas optimizadas

### ⚠️ Desventajas

1. **Complejidad Inicial**: Más código, más estructura
2. **Duplicación Aparente**: Dos repositorios en lugar de uno
3. **Consistencia**: En Nivel 3 (BDs separadas) requiere eventual consistency
4. **Curva de Aprendizaje**: El equipo debe entender CQRS

### 🎯 ¿Cuándo Usar CQRS?

| Escenario              | ¿Usar CQRS? | Nivel Recomendado |
| ---------------------- | ----------- | ----------------- |
| Lecturas >> Escrituras | ✅ Sí       | Nivel 2           |
| Queries complejas      | ✅ Sí       | Nivel 2           |
| Reportes y analytics   | ✅ Sí       | Nivel 2-3         |
| CRUD simple            | ❌ No       | N/A               |
| Prototipo rápido       | ❌ No       | N/A               |

### 💡 Recomendaciones para este Proyecto

| Módulo     | ¿Implementar CQRS? | Nivel   | Justificación                           |
| ---------- | ------------------ | ------- | --------------------------------------- |
| **Series** | ✅ **SÍ**          | Nivel 2 | Búsquedas complejas, catálogos, ranking |
| **Finan**  | ✅ **SÍ**          | Nivel 2 | Stats, balance, queries de analytics    |
| **Auth**   | ⚠️ Opcional        | Nivel 1 | Pocas operaciones, beneficio marginal   |

---

## 🚀 Plan de Implementación

### Fase 1: Preparación (2 horas)

- [ ] Crear estructura de carpetas
- [ ] Definir interfaces Command/Query base
- [ ] Crear vistas SQL optimizadas

### Fase 2: Series (4 horas)

- [ ] Migrar 7 commands (Create, Update, Delete, AssignGenres, etc.)
- [ ] Migrar 9 queries (GetById, Search, GetAll, GetGenres, etc.)
- [ ] Implementar repositorios Write/Read
- [ ] Actualizar controlador

### Fase 3: Finan (3 horas)

- [ ] Migrar 3 commands (Create, Update, Delete)
- [ ] Migrar queries complejas (InitialLoad, Stats)
- [ ] Implementar repositorios Write/Read
- [ ] Actualizar controlador

### Fase 4: Auth (1 hora)

- [ ] Separación simple (Nivel 1)
- [ ] Clarificar Commands (Register, Login) vs Queries (GetUser)

### Fase 5: Testing (2 horas)

- [ ] Tests unitarios para handlers
- [ ] Tests de integración para repositorios
- [ ] Validar performance de vistas

**Total Estimado: 12 horas**

---

## 📚 Referencias

- [CQRS Pattern - Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [CQRS Journey - Microsoft](<https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10)>)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

---

**Conclusión:** CQRS encaja perfectamente con la arquitectura limpia actual y traería beneficios significativos, especialmente para **Series** y **Finan**. La implementación es incremental y no requiere romper nada existente.

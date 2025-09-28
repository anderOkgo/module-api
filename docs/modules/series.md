# Módulo de Series (@series/)

## 📺 Descripción General

El módulo de series (`@series/`) gestiona todo lo relacionado con series de anime, incluyendo CRUD completo, gestión de imágenes, categorización por géneros y demografías, y funcionalidades de búsqueda y filtrado. Proporciona una interfaz completa para el manejo de contenido de anime.

## 🏗️ Arquitectura del Módulo

```
src/modules/series/
├── application/
│   └── series.validation.ts    # Validaciones de aplicación
├── domain/
│   ├── models/                 # Modelos de dominio
│   │   └── Series.ts
│   └── services/               # Servicios de dominio
│       ├── series.service.ts
│       └── series.factory.ts
└── infrastructure/
    ├── controllers/            # Controladores
    │   └── series.controller.ts
    ├── routes/                # Rutas
    │   └── series.routes.ts
    ├── repositories/          # Interfaces de repositorio
    │   └── series.repository.ts
    └── series.mysql.ts       # Implementación MySQL
```

## 📊 Modelos de Datos

### Series Model

```typescript
interface Series {
  id: number;
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
  image?: string;
  created_at: Date;
  updated_at: Date;
}
```

### Demography Model

```typescript
interface Demography {
  id: number;
  name: string;
  description: string;
  created_at: Date;
}
```

### Genre Model

```typescript
interface Genre {
  id: number;
  name: string;
  description: string;
  created_at: Date;
}
```

### SeriesGenre Model

```typescript
interface SeriesGenre {
  series_id: number;
  genre_id: number;
  created_at: Date;
}
```

## 🔧 Funcionalidades

### 1. CRUD de Series

**Funcionalidades**:

- Crear nuevas series
- Leer series individuales
- Actualizar series existentes
- Eliminar series
- Listar todas las series
- Búsqueda y filtrado

**Validaciones**:

- Nombre requerido y único
- Número de capítulos positivo
- Año válido (1900-2024)
- Calificación entre 0 y 10
- Demografía debe existir
- Descripción opcional

### 2. Gestión de Imágenes

**Funcionalidades**:

- Subir imágenes de series
- Optimización automática de imágenes
- Redimensionamiento a 190x285px
- Compresión a ~20KB
- Eliminación de imágenes antiguas
- Nombres de archivo basados en ID

**Especificaciones de Imagen**:

- **Formato**: JPEG
- **Dimensiones**: 190x285px
- **Tamaño**: ~20KB
- **Calidad**: 90% (ajustable)
- **Algoritmo**: Lanczos3 + optimizaciones avanzadas

### 3. Categorización

**Funcionalidades**:

- Asignar géneros a series
- Asignar demografía a series
- Gestión de géneros
- Gestión de demografías
- Búsqueda por categorías

**Categorías Predefinidas**:

- **Géneros**: Acción, Aventura, Comedia, Drama, Romance, etc.
- **Demografías**: Shounen, Shoujo, Seinen, Josei, Kodomomuke

### 4. Búsqueda y Filtrado

**Funcionalidades**:

- Búsqueda por nombre
- Filtrado por año
- Filtrado por género
- Filtrado por demografía
- Filtrado por calificación
- Ordenamiento por diferentes criterios

## 🗄️ Base de Datos

### Tabla: productions

```sql
CREATE TABLE productions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  chapter_numer INT DEFAULT NULL,
  year INT NOT NULL,
  description TEXT,
  qualification DECIMAL(3,1) DEFAULT NULL,
  demography_id INT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_year (year),
  INDEX idx_demography_id (demography_id),
  INDEX idx_visible (visible),
  FOREIGN KEY (demography_id) REFERENCES demographics(id)
);
```

### Tabla: demographics

```sql
CREATE TABLE demographics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: genres

```sql
CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: productions_genres

```sql
CREATE TABLE productions_genres (
  production_id INT NOT NULL,
  genre_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (production_id, genre_id),
  FOREIGN KEY (production_id) REFERENCES productions(id) ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);
```

### Datos Iniciales

```sql
-- Demografías predefinidas
INSERT INTO demographics (name, description) VALUES
('Shounen', 'Anime dirigido a chicos adolescentes'),
('Shoujo', 'Anime dirigido a chicas adolescentes'),
('Seinen', 'Anime dirigido a hombres adultos'),
('Josei', 'Anime dirigido a mujeres adultas'),
('Kodomomuke', 'Anime dirigido a niños');

-- Géneros predefinidos
INSERT INTO genres (name, description) VALUES
('Acción', 'Anime con mucha acción y combates'),
('Aventura', 'Anime de aventuras y exploración'),
('Comedia', 'Anime cómico y divertido'),
('Drama', 'Anime dramático y emotivo'),
('Romance', 'Anime romántico'),
('Fantasía', 'Anime de fantasía y magia'),
('Ciencia Ficción', 'Anime de ciencia ficción'),
('Horror', 'Anime de terror y suspenso');
```

## 🔄 Flujo de Datos

### Crear Serie

```
1. Request → Controller
2. Controller → Validator
3. Validator → Service
4. Service → Image Processor
5. Service → Repository
6. Repository → Database
7. Response ← Controller
```

### Actualizar Imagen

```
1. Request → Controller
2. Controller → Service
3. Service → Image Processor
4. Service → File System
5. Service → Repository
6. Repository → Database
7. Response ← Controller
```

## 🧪 Testing

### Casos de Prueba

```typescript
describe('SeriesModule', () => {
  describe('Series CRUD', () => {
    it('should create a new series');
    it('should read a series by ID');
    it('should update an existing series');
    it('should delete a series');
    it('should list all series');
  });

  describe('Image Management', () => {
    it('should upload and optimize images');
    it('should resize images to 190x285px');
    it('should compress images to ~20KB');
    it('should delete old images');
    it('should use ID as filename');
  });

  describe('Search and Filtering', () => {
    it('should search series by name');
    it('should filter by year');
    it('should filter by genre');
    it('should filter by demography');
    it('should sort by different criteria');
  });
});
```

## 📊 Métricas y KPIs

### Métricas de Contenido

- **Total Series**: Número total de series
- **Series by Year**: Series por año
- **Genre Distribution**: Distribución por géneros
- **Demography Distribution**: Distribución por demografías
- **Average Rating**: Calificación promedio

### Métricas de Imágenes

- **Image Upload Success**: Tasa de éxito de subida
- **Image Optimization**: Tiempo de optimización
- **Storage Usage**: Uso de almacenamiento
- **Image Quality**: Calidad de imágenes

## 🚀 Configuración

### Variables de Entorno

```env
# Database Configuration
DB_SERIES_NAME=animecre_series

# Image Processing
IMAGE_MAX_SIZE=5242880  # 5MB
IMAGE_TARGET_SIZE=20480  # 20KB
IMAGE_TARGET_WIDTH=190
IMAGE_TARGET_HEIGHT=285
IMAGE_QUALITY=90

# Upload Configuration
UPLOAD_DIR=uploads/series/img/tarjeta
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

### Configuración de Servicios

```typescript
// SeriesService Configuration
const seriesConfig = {
  uploadDir: path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta'),
  imageMaxSize: parseInt(process.env.IMAGE_MAX_SIZE || '5242880'),
  imageTargetSize: parseInt(process.env.IMAGE_TARGET_SIZE || '20480'),
  imageTargetWidth: parseInt(process.env.IMAGE_TARGET_WIDTH || '190'),
  imageTargetHeight: parseInt(process.env.IMAGE_TARGET_HEIGHT || '285'),
  imageQuality: parseInt(process.env.IMAGE_QUALITY || '90'),
  allowedImageTypes: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
};
```

## 🔧 API Endpoints

### POST /api/series

**Descripción**: Crear una nueva serie

**Request Body** (multipart/form-data):

```
name: "Attack on Titan"
chapter_number: 25
year: 2013
description: "Una serie de anime sobre la humanidad luchando contra titanes"
qualification: 9.5
demography_id: 1
visible: true
image: [archivo de imagen]
```

**Response**:

```json
{
  "error": false,
  "message": "Serie creada exitosamente",
  "data": {
    "id": 1,
    "name": "Attack on Titan",
    "chapter_number": 25,
    "year": 2013,
    "description": "Una serie de anime sobre la humanidad luchando contra titanes",
    "qualification": 9.5,
    "demography_id": 1,
    "visible": true,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "created_at": "2024-09-28T10:30:00Z"
  }
}
```

### GET /api/series/:id

**Descripción**: Obtener una serie por ID

**Response**:

```json
{
  "error": false,
  "data": {
    "id": 1,
    "name": "Attack on Titan",
    "chapter_number": 25,
    "year": 2013,
    "description": "Una serie de anime sobre la humanidad luchando contra titanes",
    "qualification": 9.5,
    "demography_id": 1,
    "visible": true,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "created_at": "2024-09-28T10:30:00Z"
  }
}
```

### PUT /api/series/:id

**Descripción**: Actualizar una serie existente

**Request Body** (multipart/form-data):

```
name: "Attack on Titan - Updated"
chapter_number: 30
year: 2013
description: "Descripción actualizada"
qualification: 9.8
demography_id: 1
visible: true
```

**Response**:

```json
{
  "error": false,
  "message": "Serie actualizada exitosamente",
  "data": {
    "id": 1,
    "name": "Attack on Titan - Updated",
    "chapter_number": 30,
    "year": 2013,
    "description": "Descripción actualizada",
    "qualification": 9.8,
    "demography_id": 1,
    "visible": true,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "updated_at": "2024-09-28T11:00:00Z"
  }
}
```

### DELETE /api/series/:id

**Descripción**: Eliminar una serie

**Response**:

```json
{
  "error": false,
  "message": "Serie eliminada exitosamente"
}
```

### GET /api/series

**Descripción**: Listar todas las series con filtros

**Query Parameters**:

- `limit`: Número de resultados (1-10000)
- `offset`: Desplazamiento
- `year`: Filtrar por año
- `demography_id`: Filtrar por demografía
- `search`: Búsqueda por nombre

**Response**:

```json
{
  "error": false,
  "data": [
    {
      "id": 1,
      "name": "Attack on Titan",
      "chapter_number": 25,
      "year": 2013,
      "description": "Una serie de anime sobre la humanidad luchando contra titanes",
      "qualification": 9.5,
      "demography_id": 1,
      "visible": true,
      "image": "uploads/series/img/tarjeta/1.jpg"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### GET /api/series/years

**Descripción**: Obtener años de producción únicos

**Response**:

```json
{
  "error": false,
  "data": [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
}
```

### PUT /api/series/:id/image

**Descripción**: Actualizar imagen de una serie

**Request Body** (multipart/form-data):

```
image: [archivo de imagen]
```

**Response**:

```json
{
  "error": false,
  "message": "Imagen actualizada exitosamente",
  "data": {
    "id": 1,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "updated_at": "2024-09-28T11:30:00Z"
  }
}
```

## 🖼️ Gestión de Imágenes

### Proceso de Optimización

1. **Validación**: Verificar tipo y tamaño de archivo
2. **Redimensionamiento**: Cambiar a 190x285px
3. **Compresión**: Reducir a ~20KB
4. **Optimización**: Aplicar algoritmos avanzados
5. **Guardado**: Usar ID como nombre de archivo
6. **Limpieza**: Eliminar imagen anterior

### Algoritmos de Optimización

```typescript
// Configuración de optimización
const optimizationConfig = {
  kernel: sharp.kernel.lanczos3,
  jpeg: {
    quality: 90,
    trellisQuantisation: true,
    overshootDeringing: true,
    optimizeScans: true,
    quantisationTable: 0,
  },
};
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Serie no encontrada"

```bash
# Verificar que el ID de la serie existe
# Verificar que la serie está visible
```

#### Error: "Imagen inválida"

```bash
# Verificar tipo de archivo (JPEG, PNG, WebP)
# Verificar tamaño de archivo (< 5MB)
# Verificar que el archivo no está corrupto
```

#### Error: "Optimización fallida"

```bash
# Verificar que Sharp está instalado
# Verificar permisos de escritura
# Verificar espacio en disco
```

#### Error: "Validación fallida"

```bash
# Verificar que todos los campos requeridos están presentes
# Verificar que los tipos de datos son correctos
# Verificar que los valores están en rangos válidos
```

## 📈 Dashboard de Series

### Widgets Disponibles

1. **Series Overview**

   - Total de series
   - Series por año
   - Series por demografía

2. **Top Series**

   - Series mejor calificadas
   - Series más populares
   - Series recientes

3. **Genre Distribution**

   - Distribución por géneros
   - Géneros más populares
   - Tendencias de géneros

4. **Image Management**
   - Imágenes optimizadas
   - Espacio utilizado
   - Calidad de imágenes

## 🚀 Roadmap

### Funcionalidades Futuras

- [ ] **Advanced Search**: Búsqueda avanzada con múltiples filtros
- [ ] **Recommendations**: Sistema de recomendaciones
- [ ] **User Ratings**: Calificaciones de usuarios
- [ ] **Reviews**: Sistema de reseñas
- [ ] **Watchlist**: Lista de seguimiento
- [ ] **Favorites**: Sistema de favoritos
- [ ] **Social Features**: Funcionalidades sociales
- [ ] **API Versioning**: Versionado de API

### Mejoras de Rendimiento

- [ ] **Caching**: Sistema de caché para consultas
- [ ] **CDN**: Red de distribución de contenido
- [ ] **Image CDN**: CDN para imágenes
- [ ] **Database Optimization**: Optimización de base de datos
- [ ] **Search Indexing**: Indexación de búsqueda

---

**Última actualización**: 2024-09-28

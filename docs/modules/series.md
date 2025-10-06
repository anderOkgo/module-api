# Series Module (@series/) - CQRS Implemented

## 📺 General Description

The series module (`@series/`) manages everything related to anime series, including complete CRUD operations, image management, categorization by genres and demographics, and search and filtering functionalities. It provides a complete interface for anime content management with **CQRS (Command Query Responsibility Segregation)** architecture.

## 🏗️ Module Architecture (CQRS)

```
src/modules/series/
├── application/
│   ├── commands/              # Write operations (CQRS)
│   │   ├── create-series.command.ts
│   │   ├── update-series.command.ts
│   │   ├── delete-series.command.ts
│   │   └── ...
│   ├── queries/               # Read operations (CQRS)
│   │   ├── get-series-by-id.query.ts
│   │   ├── search-series.query.ts
│   │   └── ...
│   ├── handlers/              # Command/Query handlers
│   │   ├── commands/
│   │   └── queries/
│   ├── ports/                 # Repository interfaces
│   │   ├── series-write.repository.ts
│   │   └── series-read.repository.ts
│   └── common/                # Common interfaces
│       ├── command.interface.ts
│       └── query.interface.ts
├── domain/
│   ├── entities/              # Domain models
│   │   └── series.entity.ts
│   └── ports/                 # Domain ports
│       └── image-processor.port.ts
└── infrastructure/
    ├── controllers/           # CQRS Controllers
    │   └── series-cqrs.controller.ts
    ├── persistence/           # Repository implementations
    │   ├── series-write.mysql.ts
    │   └── series-read.mysql.ts
    └── services/              # Infrastructure services
        └── image-processor.service.ts
```

## 📊 Data Models

### Series Model

Contains series information:

- Basic data (name, chapters, year, description)
- Classification (qualification, demographic)
- Visibility and image management
- Audit timestamps

### Demography Model

Stores demographic classifications:

- Demographic names and descriptions
- Creation timestamps

### Genre Model

Manages genre categories:

- Genre names and descriptions
- Creation timestamps

### SeriesGenre Model

Many-to-many relationship:

- Links series with genres
- Maintains referential integrity

## 🔧 Features

### 1. Series CRUD (CQRS)

**Commands (Write Operations)**:

- Create new series
- Update existing series
- Delete series
- Assign/remove genres
- Add/remove titles
- Update series images

**Queries (Read Operations)**:

- Get series by ID
- Search series with filters
- List all series with pagination
- Get genres and demographics
- Get production years

**Validations**:

- Name required and unique
- Positive chapter number
- Valid year (1900-current year)
- Rating between 0 and 10
- Demography must exist
- Optional description

### 2. Image Management

**Features**:

- Upload series images
- Automatic image optimization
- Resize to 190x285px
- Compress to ~20KB
- Delete old images
- ID-based filenames

**Image Specifications**:

- **Format**: JPEG
- **Dimensions**: 190x285px
- **Size**: ~20KB
- **Quality**: 90% (adjustable)
- **Algorithm**: Lanczos3 + advanced optimizations

### 3. Categorization

**Features**:

- Assign genres to series
- Assign demographics to series
- Genre management
- Demographics management
- Search by categories

**Predefined Categories**:

- **Genres**: Action, Adventure, Comedy, Drama, Romance, etc.
- **Demographics**: Shounen, Shoujo, Seinen, Josei, Kodomomuke

### 4. Search and Filtering

**Features**:

- Search by name
- Filter by year
- Filter by genre
- Filter by demographics
- Filter by rating
- Sort by different criteria

## 🗄️ Database

### productions Table

Stores series information:

- Basic series data (name, chapters, year, description)
- Classification data (rating, demographic)
- Visibility and image management
- Optimized indexes for queries

### demographics Table

Manages demographic classifications:

- Demographic names and descriptions
- Creation timestamps

### genres Table

Stores genre categories:

- Genre names and descriptions
- Creation timestamps

### productions_genres Table

Many-to-many relationship:

- Links series with genres
- Maintains referential integrity
- Cascade deletion support

## 🔄 Data Flow (CQRS)

### Create Series (Command)

1. Request → Controller
2. Controller → Command Handler
3. Handler → Validator
4. Handler → Image Processor
5. Handler → Write Repository
6. Repository → Database
7. Response ← Controller

### Update Image (Command)

1. Request → Controller
2. Controller → Command Handler
3. Handler → Image Processor
4. Handler → File System
5. Handler → Write Repository
6. Repository → Database
7. Response ← Controller

### Search Series (Query)

1. Request → Controller
2. Controller → Query Handler
3. Handler → Read Repository
4. Repository → Database
5. Response ← Controller

## 🧪 Testing

### Test Cases

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

## 📊 Metrics and KPIs

### Content Metrics

- **Total Series**: Total number of series
- **Series by Year**: Series by year
- **Genre Distribution**: Distribution by genres
- **Demography Distribution**: Distribution by demographics
- **Average Rating**: Average rating

### Image Metrics

- **Image Upload Success**: Upload success rate
- **Image Optimization**: Optimization time
- **Storage Usage**: Storage usage
- **Image Quality**: Image quality

## 🚀 Configuration

### Environment Variables

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

### Service Configuration

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

**Description**: Create a new series

**Request Body** (multipart/form-data):

```
name: "Attack on Titan"
chapter_number: 25
year: 2013
description: "An anime series about humanity fighting against titans"
description_en: "An anime series about humanity fighting against titans"
qualification: 9.5
demography_id: 1
visible: true
image: [image file]
```

**Response**:

```json
{
  "error": false,
  "message": "Series created successfully",
  "data": {
    "id": 1,
    "name": "Attack on Titan",
    "chapter_number": 25,
    "year": 2013,
    "description": "An anime series about humanity fighting against titans",
    "description_en": "An anime series about humanity fighting against titans",
    "qualification": 9.5,
    "demography_id": 1,
    "visible": true,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "created_at": "2024-09-28T10:30:00Z"
  }
}
```

### GET /api/series/:id

**Description**: Get a series by ID

**Response**:

```json
{
  "error": false,
  "data": {
    "id": 1,
    "name": "Attack on Titan",
    "chapter_number": 25,
    "year": 2013,
    "description": "An anime series about humanity fighting against titans",
    "description_en": "An anime series about humanity fighting against titans",
    "qualification": 9.5,
    "demography_id": 1,
    "visible": true,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "created_at": "2024-09-28T10:30:00Z"
  }
}
```

### PUT /api/series/:id

**Description**: Update an existing series

**Request Body** (multipart/form-data):

```
name: "Attack on Titan - Updated"
chapter_number: 30
year: 2013
description: "Updated description"
description_en: "Updated description in English"
qualification: 9.8
demography_id: 1
visible: true
```

**Response**:

```json
{
  "error": false,
  "message": "Series updated successfully",
  "data": {
    "id": 1,
    "name": "Attack on Titan - Updated",
    "chapter_number": 30,
    "year": 2013,
    "description": "Updated description",
    "description_en": "Updated description in English",
    "qualification": 9.8,
    "demography_id": 1,
    "visible": true,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "updated_at": "2024-09-28T11:00:00Z"
  }
}
```

### DELETE /api/series/:id

**Description**: Delete a series

**Response**:

```json
{
  "error": false,
  "message": "Series deleted successfully"
}
```

### GET /api/series

**Description**: List all series with filters

**Query Parameters**:

- `limit`: Number of results (1-10000)
- `offset`: Offset
- `year`: Filter by year
- `demography_id`: Filter by demography
- `search`: Search by name

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
      "description": "An anime series about humanity fighting against titans",
      "description_en": "An anime series about humanity fighting against titans",
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

**Description**: Get unique production years

**Response**:

```json
{
  "error": false,
  "data": [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
}
```

### PUT /api/series/:id/image

**Description**: Update series image

**Request Body** (multipart/form-data):

```
image: [image file]
```

**Response**:

```json
{
  "error": false,
  "message": "Image updated successfully",
  "data": {
    "id": 1,
    "image": "uploads/series/img/tarjeta/1.jpg",
    "updated_at": "2024-09-28T11:30:00Z"
  }
}
```

## 🖼️ Image Management

### Optimization Process

1. **Validation**: Verify file type and size
2. **Resizing**: Change to 190x285px
3. **Compression**: Reduce to ~20KB
4. **Optimization**: Apply advanced algorithms
5. **Saving**: Use ID as filename
6. **Cleanup**: Delete previous image

### Optimization Algorithms

```typescript
// Optimization configuration
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

### Common Problems

#### Error: "Series not found"

```bash
# Verify that the series ID exists
# Verify that the series is visible
```

#### Error: "Invalid image"

```bash
# Verify file type (JPEG, PNG, WebP)
# Verify file size (< 5MB)
# Verify that the file is not corrupted
```

#### Error: "Optimization failed"

```bash
# Verify that Sharp is installed
# Verify write permissions
# Verify disk space
```

#### Error: "Validation failed"

```bash
# Verify that all required fields are present
# Verify that data types are correct
# Verify that values are in valid ranges
```

## 📈 Series Dashboard

### Available Widgets

1. **Series Overview**

   - Total series
   - Series by year
   - Series by demography

2. **Top Series**

   - Best rated series
   - Most popular series
   - Recent series

3. **Genre Distribution**

   - Distribution by genres
   - Most popular genres
   - Genre trends

4. **Image Management**
   - Optimized images
   - Storage used
   - Image quality

## 🚀 Roadmap

### Future Features

- [ ] **Advanced Search**: Advanced search with multiple filters
- [ ] **Recommendations**: Recommendation system
- [ ] **User Ratings**: User ratings
- [ ] **Reviews**: Review system
- [ ] **Watchlist**: Watchlist
- [ ] **Favorites**: Favorites system
- [ ] **Social Features**: Social features
- [ ] **API Versioning**: API versioning

### Performance Improvements

- [ ] **Caching**: Cache system for queries
- [ ] **CDN**: Content distribution network
- [ ] **Image CDN**: CDN for images
- [ ] **Database Optimization**: Database optimization
- [ ] **Search Indexing**: Search indexing

---

**Last updated**: 2025-10-05

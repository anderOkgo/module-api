# Módulo Financiero (@finan/)

## 💰 Descripción General

El módulo financiero (`@finan/`) gestiona todo lo relacionado con finanzas personales, incluyendo movimientos de dinero, categorías de gastos, reportes financieros y análisis de gastos. Proporciona una interfaz completa para el manejo de finanzas personales.

## 🏗️ Arquitectura del Módulo

```
src/modules/finan/
├── application/
│   └── finan.validations.ts    # Validaciones de aplicación
├── domain/
│   ├── models/                 # Modelos de dominio
│   │   └── Finan.ts
│   └── services/               # Servicios de dominio
│       ├── finan.service.ts
│       └── finan.factory.ts
└── infrastructure/
    ├── controllers/            # Controladores
    │   └── finan.controller.ts
    ├── routes/                # Rutas
    │   └── finan.routes.ts
    ├── repositories/          # Interfaces de repositorio
    │   └── finan.repository.ts
    └── finan.mysql.ts         # Implementación MySQL
```

## 📊 Modelos de Datos

### Movement Model

```typescript
interface Movement {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  date_movement: Date;
  category: string;
  created_at: Date;
  updated_at: Date;
}
```

### Category Model

```typescript
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: Date;
}
```

### Financial Report Model

```typescript
interface FinancialReport {
  total_income: number;
  total_expenses: number;
  balance: number;
  monthly_expenses: number[];
  categories_breakdown: CategoryBreakdown[];
}
```

## 🔧 Funcionalidades

### 1. Gestión de Movimientos

**Funcionalidades**:

- Crear movimientos de ingresos y gastos
- Actualizar movimientos existentes
- Eliminar movimientos
- Listar movimientos con filtros
- Búsqueda por descripción, categoría o fecha

**Validaciones**:

- Monto debe ser numérico y positivo
- Descripción requerida
- Fecha válida
- Categoría debe existir

### 2. Gestión de Categorías

**Funcionalidades**:

- Crear categorías de ingresos y gastos
- Actualizar categorías
- Eliminar categorías
- Asignar colores a categorías
- Categorías predefinidas del sistema

**Categorías Predefinidas**:

- **Ingresos**: Salario, Freelance, Inversiones
- **Gastos**: Alimentación, Transporte, Entretenimiento, Servicios

### 3. Reportes Financieros

**Funcionalidades**:

- Balance general
- Gastos mensuales
- Ingresos mensuales
- Análisis por categorías
- Tendencias temporales
- Proyecciones financieras

### 4. Análisis de Gastos

**Funcionalidades**:

- Gastos por categoría
- Gastos por período
- Comparación de períodos
- Identificación de patrones
- Alertas de gastos excesivos

## 🗄️ Base de Datos

### Tabla: movements

```sql
CREATE TABLE movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  date_movement DATE NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_date_movement (date_movement),
  INDEX idx_category (category)
);
```

### Tabla: categories

```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  color VARCHAR(7) DEFAULT '#007bff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_name_type (name, type)
);
```

### Datos Iniciales

```sql
-- Categorías predefinidas
INSERT INTO categories (name, type, color) VALUES
('Salario', 'income', '#28a745'),
('Freelance', 'income', '#17a2b8'),
('Inversiones', 'income', '#6f42c1'),
('Alimentación', 'expense', '#dc3545'),
('Transporte', 'expense', '#fd7e14'),
('Entretenimiento', 'expense', '#e83e8c'),
('Servicios', 'expense', '#20c997');
```

## 🔄 Flujo de Datos

### Crear Movimiento

```
1. Request → Controller
2. Controller → Validator
3. Validator → Service
4. Service → Repository
5. Repository → Database
6. Response ← Controller
```

### Generar Reporte

```
1. Request → Controller
2. Controller → Service
3. Service → Repository
4. Repository → Database
5. Service → Data Processing
6. Response ← Controller
```

## 🧪 Testing

### Casos de Prueba

```typescript
describe('FinanModule', () => {
  describe('Movement Management', () => {
    it('should create a new movement');
    it('should update an existing movement');
    it('should delete a movement');
    it('should list movements with filters');
    it('should validate movement data');
  });

  describe('Category Management', () => {
    it('should create a new category');
    it('should update an existing category');
    it('should delete a category');
    it('should list categories by type');
  });

  describe('Financial Reports', () => {
    it('should generate balance report');
    it('should generate monthly expenses report');
    it('should generate category breakdown');
    it('should calculate financial trends');
  });
});
```

## 📊 Métricas y KPIs

### Métricas Financieras

- **Total Income**: Ingresos totales
- **Total Expenses**: Gastos totales
- **Net Balance**: Balance neto
- **Monthly Growth**: Crecimiento mensual
- **Expense Ratio**: Ratio de gastos

### Métricas de Categorías

- **Top Categories**: Categorías más utilizadas
- **Category Distribution**: Distribución por categorías
- **Spending Patterns**: Patrones de gasto
- **Category Trends**: Tendencias por categoría

## 🚀 Configuración

### Variables de Entorno

```env
# Database Configuration
DB_FINAN_NAME=animecre_finan

# Financial Settings
DEFAULT_CURRENCY=USD
DATE_FORMAT=YYYY-MM-DD
DECIMAL_PLACES=2

# Reporting
REPORT_PERIOD_DAYS=30
MAX_CATEGORIES=50
```

### Configuración de Servicios

```typescript
// FinanService Configuration
const finanConfig = {
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
  dateFormat: process.env.DATE_FORMAT || 'YYYY-MM-DD',
  decimalPlaces: parseInt(process.env.DECIMAL_PLACES || '2'),
  reportPeriodDays: parseInt(process.env.REPORT_PERIOD_DAYS || '30'),
  maxCategories: parseInt(process.env.MAX_CATEGORIES || '50'),
};
```

## 🔧 API Endpoints

### POST /api/finan/initial-load

**Descripción**: Carga inicial de datos financieros

**Request Body**:

```json
{
  "date": "2024-09-28",
  "currency": "USD"
}
```

**Response**:

```json
{
  "error": false,
  "data": {
    "balance": 1500.0,
    "monthly_expenses": [200.0, 150.0, 300.0],
    "categories": [
      {
        "id": 1,
        "name": "Alimentación",
        "type": "expense",
        "color": "#dc3545"
      }
    ],
    "recent_movements": [
      {
        "id": 1,
        "amount": -50.0,
        "description": "Supermercado",
        "date_movement": "2024-09-28",
        "category": "Alimentación"
      }
    ]
  }
}
```

### POST /api/finan/insert

**Descripción**: Crear un nuevo movimiento

**Request Body**:

```json
{
  "amount": -75.5,
  "description": "Gasolina",
  "date_movement": "2024-09-28",
  "category": "Transporte"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Movimiento creado exitosamente",
  "data": {
    "id": 2,
    "amount": -75.5,
    "description": "Gasolina",
    "date_movement": "2024-09-28",
    "category": "Transporte",
    "created_at": "2024-09-28T10:30:00Z"
  }
}
```

### PUT /api/finan/update/:id

**Descripción**: Actualizar un movimiento existente

**Request Body**:

```json
{
  "amount": -80.0,
  "description": "Gasolina - Actualizado",
  "category": "Transporte"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Movimiento actualizado exitosamente",
  "data": {
    "id": 2,
    "amount": -80.0,
    "description": "Gasolina - Actualizado",
    "date_movement": "2024-09-28",
    "category": "Transporte",
    "updated_at": "2024-09-28T11:00:00Z"
  }
}
```

### DELETE /api/finan/delete/:id

**Descripción**: Eliminar un movimiento

**Response**:

```json
{
  "error": false,
  "message": "Movimiento eliminado exitosamente"
}
```

## 📈 Reportes y Análisis

### Tipos de Reportes

1. **Balance General**

   - Ingresos totales
   - Gastos totales
   - Balance neto
   - Tendencias mensuales

2. **Gastos por Categoría**

   - Distribución de gastos
   - Top categorías
   - Comparación de períodos

3. **Análisis Temporal**

   - Gastos mensuales
   - Ingresos mensuales
   - Tendencias anuales
   - Proyecciones

4. **Alertas Financieras**
   - Gastos excesivos
   - Presupuesto excedido
   - Patrones inusuales

### Métricas de Rendimiento

- **Tiempo de respuesta**: < 200ms
- **Throughput**: 1000 requests/min
- **Disponibilidad**: 99.9%
- **Precisión de cálculos**: 100%

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Movimiento no encontrado"

```bash
# Verificar que el ID del movimiento existe
# Verificar que el usuario tiene acceso al movimiento
```

#### Error: "Categoría no válida"

```bash
# Verificar que la categoría existe en la base de datos
# Verificar que el tipo de categoría es correcto
```

#### Error: "Monto inválido"

```bash
# Verificar que el monto es numérico
# Verificar que el monto es positivo para ingresos
# Verificar que el monto es negativo para gastos
```

#### Error: "Fecha inválida"

```bash
# Verificar formato de fecha (YYYY-MM-DD)
# Verificar que la fecha no es futura
# Verificar que la fecha es válida
```

## 📊 Dashboard Financiero

### Widgets Disponibles

1. **Balance Widget**

   - Balance actual
   - Cambio desde el mes anterior
   - Tendencias

2. **Gastos Widget**

   - Gastos del mes actual
   - Comparación con mes anterior
   - Proyección mensual

3. **Categorías Widget**

   - Top 5 categorías de gastos
   - Distribución por categorías
   - Comparación de períodos

4. **Movimientos Widget**
   - Últimos movimientos
   - Movimientos pendientes
   - Alertas financieras

## 🚀 Roadmap

### Funcionalidades Futuras

- [ ] **Budget Management**: Gestión de presupuestos
- [ ] **Recurring Transactions**: Transacciones recurrentes
- [ ] **Investment Tracking**: Seguimiento de inversiones
- [ ] **Debt Management**: Gestión de deudas
- [ ] **Financial Goals**: Objetivos financieros
- [ ] **Tax Reporting**: Reportes de impuestos
- [ ] **Multi-Currency**: Soporte para múltiples monedas
- [ ] **Data Export**: Exportación de datos

### Mejoras de Rendimiento

- [ ] **Caching**: Sistema de caché para reportes
- [ ] **Indexing**: Optimización de índices
- [ ] **Pagination**: Paginación de resultados
- [ ] **Real-time Updates**: Actualizaciones en tiempo real
- [ ] **Background Processing**: Procesamiento en segundo plano

---

**Última actualización**: 2024-09-28

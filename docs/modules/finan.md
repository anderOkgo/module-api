# Financial Module (@finan/)

## 💰 General Description

The financial module (`@finan/`) manages everything related to personal finances, including money movements, expense categories, financial reports, and expense analysis. It provides a complete interface for personal finance management.

## 🏗️ Module Architecture

```
src/modules/finan/
├── application/
│   └── finan.validations.ts    # Application validations
├── domain/
│   ├── models/                 # Domain models
│   │   └── Finan.ts
│   └── services/               # Domain services
│       ├── finan.service.ts
│       └── finan.factory.ts
└── infrastructure/
    ├── controllers/            # Controllers
    │   └── finan.controller.ts
    ├── routes/                # Routes
    │   └── finan.routes.ts
    ├── repositories/          # Repository interfaces
    │   └── finan.repository.ts
    └── finan.mysql.ts         # MySQL implementation
```

## 📊 Data Models

### Movement Model

Contains financial movements:

- Transaction data (amount, description, date)
- User association
- Category classification
- Audit timestamps

### Category Model

Stores financial categories:

- Category names and types (income/expense)
- Visual representation (colors)
- Creation timestamps

### Financial Report Model

Aggregated financial data:

- Total income and expenses
- Net balance calculations
- Monthly expense trends
- Category breakdowns

## 🔧 Features

### 1. Movement Management

**Features**:

- Create income and expense movements
- Update existing movements
- Delete movements
- List movements with filters
- Search by description, category, or date

**Validations**:

- Amount must be numeric and positive
- Description required
- Valid date
- Category must exist

### 2. Category Management

**Features**:

- Create income and expense categories
- Update categories
- Delete categories
- Assign colors to categories
- System predefined categories

**Predefined Categories**:

- **Income**: Salary, Freelance, Investments
- **Expenses**: Food, Transportation, Entertainment, Services

### 3. Financial Reports

**Features**:

- General balance
- Monthly expenses
- Monthly income
- Category analysis
- Temporal trends
- Financial projections

### 4. Expense Analysis

**Features**:

- Expenses by category
- Expenses by period
- Period comparison
- Pattern identification
- Excessive expense alerts

## 🗄️ Database

### movements Table

Stores financial movements:

- Transaction data (amount, description, date)
- User association
- Category classification
- Optimized indexes for queries

### categories Table

Manages financial categories:

- Category names and types (income/expense)
- Visual representation (colors)
- Unique constraints

### Initial Data

Predefined categories include:

- **Income**: Salary, Freelance, Investments
- **Expenses**: Food, Transportation, Entertainment, Services

## 🔄 Data Flow

### Create Movement

1. Request → Controller
2. Controller → Validator
3. Validator → Service
4. Service → Repository
5. Repository → Database
6. Response ← Controller

### Generate Report

1. Request → Controller
2. Controller → Service
3. Service → Repository
4. Repository → Database
5. Service → Data Processing
6. Response ← Controller

## 🧪 Testing

### Test Cases

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

## 📊 Metrics and KPIs

### Financial Metrics

- **Total Income**: Total income
- **Total Expenses**: Total expenses
- **Net Balance**: Net balance
- **Monthly Growth**: Monthly growth
- **Expense Ratio**: Expense ratio

### Category Metrics

- **Top Categories**: Most used categories
- **Category Distribution**: Distribution by categories
- **Spending Patterns**: Spending patterns
- **Category Trends**: Category trends

## 🚀 Configuration

### Environment Variables

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

### Service Configuration

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

**Description**: Initial financial data load

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
        "name": "Food",
        "type": "expense",
        "color": "#dc3545"
      }
    ],
    "recent_movements": [
      {
        "id": 1,
        "amount": -50.0,
        "description": "Supermarket",
        "date_movement": "2024-09-28",
        "category": "Food"
      }
    ]
  }
}
```

### POST /api/finan/insert

**Description**: Create a new movement

**Request Body**:

```json
{
  "amount": -75.5,
  "description": "Gasoline",
  "date_movement": "2024-09-28",
  "category": "Transportation"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Movement created successfully",
  "data": {
    "id": 2,
    "amount": -75.5,
    "description": "Gasoline",
    "date_movement": "2024-09-28",
    "category": "Transportation",
    "created_at": "2024-09-28T10:30:00Z"
  }
}
```

### PUT /api/finan/update/:id

**Description**: Update an existing movement

**Request Body**:

```json
{
  "amount": -80.0,
  "description": "Gasoline - Updated",
  "category": "Transportation"
}
```

**Response**:

```json
{
  "error": false,
  "message": "Movement updated successfully",
  "data": {
    "id": 2,
    "amount": -80.0,
    "description": "Gasoline - Updated",
    "date_movement": "2024-09-28",
    "category": "Transportation",
    "updated_at": "2024-09-28T11:00:00Z"
  }
}
```

### DELETE /api/finan/delete/:id

**Description**: Delete a movement

**Response**:

```json
{
  "error": false,
  "message": "Movement deleted successfully"
}
```

## 📈 Reports and Analysis

### Report Types

1. **General Balance**

   - Total income
   - Total expenses
   - Net balance
   - Monthly trends

2. **Expenses by Category**

   - Expense distribution
   - Top categories
   - Period comparison

3. **Temporal Analysis**

   - Monthly expenses
   - Monthly income
   - Annual trends
   - Projections

4. **Financial Alerts**
   - Excessive expenses
   - Budget exceeded
   - Unusual patterns

### Performance Metrics

- **Response time**: < 200ms
- **Throughput**: 1000 requests/min
- **Availability**: 99.9%
- **Calculation accuracy**: 100%

## 🐛 Troubleshooting

### Common Problems

#### Error: "Movement not found"

```bash
# Verify that the movement ID exists
# Verify that the user has access to the movement
```

#### Error: "Invalid category"

```bash
# Verify that the category exists in the database
# Verify that the category type is correct
```

#### Error: "Invalid amount"

```bash
# Verify that the amount is numeric
# Verify that the amount is positive for income
# Verify that the amount is negative for expenses
```

#### Error: "Invalid date"

```bash
# Verify date format (YYYY-MM-DD)
# Verify that the date is not in the future
# Verify that the date is valid
```

## 📊 Financial Dashboard

### Available Widgets

1. **Balance Widget**

   - Current balance
   - Change from previous month
   - Trends

2. **Expenses Widget**

   - Current month expenses
   - Comparison with previous month
   - Monthly projection

3. **Categories Widget**

   - Top 5 expense categories
   - Distribution by categories
   - Period comparison

4. **Movements Widget**
   - Recent movements
   - Pending movements
   - Financial alerts

## 🚀 Roadmap

### Future Features

- [ ] **Budget Management**: Budget management
- [ ] **Recurring Transactions**: Recurring transactions
- [ ] **Investment Tracking**: Investment tracking
- [ ] **Debt Management**: Debt management
- [ ] **Financial Goals**: Financial goals
- [ ] **Tax Reporting**: Tax reporting
- [ ] **Multi-Currency**: Multi-currency support
- [ ] **Data Export**: Data export

### Performance Improvements

- [ ] **Caching**: Cache system for reports
- [ ] **Indexing**: Index optimization
- [ ] **Pagination**: Result pagination
- [ ] **Real-time Updates**: Real-time updates
- [ ] **Background Processing**: Background processing

---

**Last updated**: 2025-10-05

# Databases - Module-API

## 🗄️ Database Architecture

The Module-API system uses multiple databases organized by module, each with its specific purpose and optimized for its application domain.

## 📊 General Structure

```
MariaDB Container
├── animecre_auth      # Authentication module
├── animecre_cake514   # Main database
├── animecre_finan     # Finance module
└── animecre_series    # Series module
```

## 🔐 Authentication Database (animecre_auth)

### Purpose

Manages users, authentication, authorization, and system security.

### Main Tables

#### users

Stores user information including:

- Personal data (first name, last name, username, email)
- Authentication data (password hash, role)
- Security data (login attempts, account lockout)
- Audit data (creation, modification, last login timestamps)

#### email_verification

Manages email verification process:

- Email addresses pending verification
- Verification codes
- Timestamps for verification tracking

### Features

- **Security**: Passwords hashed with bcrypt
- **Access Control**: Roles and permissions
- **Audit**: Login and modification logging
- **Protection**: Failed attempt control and account locking

## 🏠 Main Database (animecre_cake514)

### Purpose

Stores main system data, including productions, demographics, and genres.

### Main Tables

#### productions

Contains production information:

- Basic data (name, chapters, year, description)
- Classification (qualification, demographic)
- Visibility and image management
- Audit timestamps

#### demographics

Stores demographic classifications:

- Demographic names and descriptions
- Creation timestamps

#### genres

Manages genre categories:

- Genre names and descriptions
- Creation timestamps

#### productions_genres

Many-to-many relationship table:

- Links productions with genres
- Maintains referential integrity

### Optimized Views

#### view_all_info_productions

Combines production data with related information:

- Production details with demographic names
- Aggregated genre information
- Optimized for read operations

#### view_all_years_productions

Provides distinct production years:

- Only visible productions
- Ordered by year (descending)
- Optimized for filtering and search

### Stored Procedures

#### update_rank()

Updates production rankings:

- Calculates average qualifications
- Maintains ranking consistency
- Called automatically after data modifications

## 💰 Finance Database (animecre_finan)

### Purpose

Manages financial movements, categories, and reports for the finance module.

### Main Tables

#### movements

Stores financial transactions:

- User-specific movements
- Amount, description, and date
- Category classification
- Audit timestamps
- Optimized indexes for queries

#### categories

Manages movement categories:

- Category names and types (income/expense)
- Color coding for UI display
- Unique constraints for data integrity

### Stored Procedures

#### proc_monthly_expenses_until_day

Calculates monthly expenses:

- Groups expenses by month
- Filters by user and date range
- Returns ordered results with limits
- Optimized for reporting

#### proc_view_balance_until_date

Computes balance calculations:

- Separates income and expenses
- Calculates total balance
- Filters by user and date
- Returns comprehensive financial summary

## 📺 Series Database (animecre_series)

### Purpose

Manages anime series, including complete CRUD operations, images, and categorization.

### Main Tables

#### productions

Contains series information:

- Basic data (name, chapters, year, description)
- Classification (qualification, demographic)
- Visibility and image management
- Audit timestamps

#### demographics

Stores demographic classifications:

- Demographic names and descriptions
- Creation timestamps

#### genres

Manages genre categories:

- Genre names and descriptions
- Creation timestamps

#### productions_genres

Many-to-many relationship table:

- Links productions with genres
- Maintains referential integrity

## 🔧 Connection Configuration

### Environment Variables

```env
# Base configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# Databases by module
DB_AUTH_NAME=animecre_auth
DB_MAIN_NAME=animecre_cake514
DB_FINAN_NAME=animecre_finan
DB_SERIES_NAME=animecre_series
```

### Module-specific Connection Configuration

```typescript
// Base configuration
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'animecream',
  password: process.env.DB_PASSWORD || 'animecream123',
  charset: 'utf8mb4',
  timezone: 'Z',
};

// Module-specific configurations
const dbConfigs = {
  auth: { ...baseConfig, database: 'animecre_auth' },
  main: { ...baseConfig, database: 'animecre_cake514' },
  finan: { ...baseConfig, database: 'animecre_finan' },
  series: { ...baseConfig, database: 'animecre_series' },
};
```

## 📊 Database Optimizations

### Strategic Indexes

Optimized indexes for query performance:

- Production year and visibility indexes
- User and date movement indexes
- Email and username indexes for authentication
- Composite indexes for complex queries

### Performance Configuration

Optimized MariaDB settings:

- InnoDB buffer pool configuration
- Connection limits and caching
- Query cache optimization
- Memory allocation tuning

## 🔄 Migrations and Versioning

### Migration Scripts

```
sql/
├── 00-create-module-databases.sql    # Create all databases
├── 01-setup-auth-module.sql          # Configure authentication module
├── 02-setup-main-database.sql        # Configure main database
├── 03-setup-finan-module.sql         # Configure finance module
├── 04-setup-series-module.sql        # Configure series module
└── 99-verify-databases.sql           # Verify everything was created correctly
```

### Security Migration

Security enhancements for user management:

- Added login attempt tracking
- Implemented last login timestamps
- Added account lockout functionality
- Created optimization indexes for security queries

## 🧪 Database Testing

### Test Cases

```typescript
describe('Database Tests', () => {
  describe('Connection Tests', () => {
    it('should connect to auth database');
    it('should connect to main database');
    it('should connect to finan database');
    it('should connect to series database');
  });

  describe('Data Integrity Tests', () => {
    it('should maintain referential integrity');
    it('should enforce unique constraints');
    it('should validate data types');
    it('should handle foreign key constraints');
  });

  describe('Performance Tests', () => {
    it('should execute queries within time limits');
    it('should handle concurrent connections');
    it('should optimize query performance');
  });
});
```

## 📊 Monitoring and Metrics

### Database Metrics

- **Connection Pool**: Number of active connections
- **Query Performance**: Query execution time
- **Database Size**: Size of each database
- **Index Usage**: Index utilization
- **Lock Contention**: Lock contention

### Monitoring Tools

Key monitoring queries:

- Check connection status and active processes
- Verify index usage and optimization
- Monitor database sizes and growth
- Track performance metrics
- Analyze query execution plans

## 🚀 Scalability

### Scalability Strategies

1. **Horizontal Scaling**: Multiple database instances
2. **Read Replicas**: Read-only replicas
3. **Sharding**: Partitioning by module
4. **Caching**: Frequent query caching

### High Availability Configuration

Production setup for high availability:

- Master-slave replication configuration
- Automatic failover mechanisms
- Load balancing for read operations
- Backup and recovery strategies
- Monitoring and alerting systems

## 🔒 Database Security

### Security Measures

1. **Encryption**: SSL/TLS connections
2. **Authentication**: Secure users and passwords
3. **Authorization**: Granular permissions
4. **Audit**: Access and modification logging

### Security Configuration

Module-specific user setup:

- Create dedicated users for each module
- Assign granular permissions per database
- Implement role-based access control
- Monitor user activities and access patterns
- Regular security audits and updates

## 🐛 Troubleshooting

### Common Issues

#### Error: "Database not found"

Troubleshooting steps:

- Verify databases were created successfully
- Check initialization scripts execution
- Review Docker container logs
- Validate database creation process

#### Error: "Connection refused"

Resolution steps:

- Verify container is running properly
- Check network configuration
- Validate port mappings
- Review Docker Compose setup

#### Error: "Access denied"

Security troubleshooting:

- Verify user credentials
- Check user permissions
- Validate authentication configuration
- Review security policies

### Diagnostic Commands

Essential troubleshooting commands:

- Check container status and health
- Review detailed application logs
- Access database for direct queries
- Verify database configuration
- Monitor system resources and performance

---

**Last updated**: 2025-10-05

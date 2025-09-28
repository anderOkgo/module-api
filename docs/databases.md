# Bases de Datos - Module-API

## 🗄️ Arquitectura de Base de Datos

El sistema Module-API utiliza múltiples bases de datos organizadas por módulo, cada una con su propósito específico y optimizada para su dominio de aplicación.

## 📊 Estructura General

```
MariaDB Container
├── animecre_auth      # Módulo de autenticación
├── animecre_cake514   # Base de datos principal
├── animecre_finan     # Módulo financiero
└── animecre_series    # Módulo de series
```

## 🔐 Base de Datos de Autenticación (animecre_auth)

### Propósito

Gestiona usuarios, autenticación, autorización y seguridad del sistema.

### Tablas Principales

#### users

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME NULL,
  login_attempts INT NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_locked_until (locked_until),
  INDEX idx_last_login (last_login)
);
```

#### email_verification

```sql
CREATE TABLE email_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  verification_code INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_verification_code (verification_code)
);
```

### Características

- **Seguridad**: Contraseñas hasheadas con bcrypt
- **Control de Acceso**: Roles y permisos
- **Auditoría**: Registro de logins y modificaciones
- **Protección**: Control de intentos fallidos y bloqueo de cuentas

## 🏠 Base de Datos Principal (animecre_cake514)

### Propósito

Almacena datos principales del sistema, incluyendo producciones, demografías y géneros.

### Tablas Principales

#### productions

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

#### demographics

```sql
CREATE TABLE demographics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### genres

```sql
CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### productions_genres

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

### Vistas Optimizadas

#### view_all_info_productions

```sql
CREATE VIEW view_all_info_productions AS
SELECT
  p.id,
  p.name,
  p.chapter_numer,
  p.year,
  p.description,
  p.qualification,
  p.visible,
  p.image,
  d.name as demography_name,
  GROUP_CONCAT(g.name) as genres
FROM productions p
LEFT JOIN demographics d ON p.demography_id = d.id
LEFT JOIN productions_genres pg ON p.id = pg.production_id
LEFT JOIN genres g ON pg.genre_id = g.id
GROUP BY p.id;
```

#### view_all_years_productions

```sql
CREATE VIEW view_all_years_productions AS
SELECT DISTINCT year
FROM productions
WHERE visible = TRUE
ORDER BY year DESC;
```

### Procedimientos Almacenados

#### update_rank()

```sql
DELIMITER //
CREATE PROCEDURE update_rank()
BEGIN
  UPDATE productions
  SET qualification = (
    SELECT AVG(qualification)
    FROM productions p2
    WHERE p2.id = productions.id
  );
END //
DELIMITER ;
```

## 💰 Base de Datos Financiera (animecre_finan)

### Propósito

Gestiona movimientos financieros, categorías y reportes del módulo financiero.

### Tablas Principales

#### movements

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

#### categories

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

### Procedimientos Almacenados

#### proc_monthly_expenses_until_day

```sql
DELIMITER //
CREATE PROCEDURE proc_monthly_expenses_until_day(
  IN p_user_id INT,
  IN p_currency VARCHAR(3),
  IN p_order VARCHAR(4),
  IN p_limit INT
)
BEGIN
  SELECT
    DATE_FORMAT(date_movement, '%Y-%m') as month,
    SUM(ABS(amount)) as total_expenses
  FROM movements
  WHERE user_id = p_user_id
    AND amount < 0
    AND date_movement <= CURDATE()
  GROUP BY DATE_FORMAT(date_movement, '%Y-%m')
  ORDER BY month DESC
  LIMIT p_limit;
END //
DELIMITER ;
```

#### proc_view_balance_until_date

```sql
DELIMITER //
CREATE PROCEDURE proc_view_balance_until_date(
  IN p_user_id INT,
  IN p_currency VARCHAR(3),
  IN p_date DATE
)
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(amount), 0) as balance
  FROM movements
  WHERE user_id = p_user_id
    AND date_movement <= p_date;
END //
DELIMITER ;
```

## 📺 Base de Datos de Series (animecre_series)

### Propósito

Gestiona series de anime, incluyendo CRUD completo, imágenes y categorización.

### Tablas Principales

#### productions

```sql
CREATE TABLE productions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  chapter_number INT DEFAULT NULL,
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

#### demographics

```sql
CREATE TABLE demographics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### genres

```sql
CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### productions_genres

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

## 🔧 Configuración de Conexión

### Variables de Entorno

```env
# Configuración base
DB_HOST=localhost
DB_PORT=3306
DB_USER=animecream
DB_PASSWORD=animecream123

# Bases de datos por módulo
DB_AUTH_NAME=animecre_auth
DB_MAIN_NAME=animecre_cake514
DB_FINAN_NAME=animecre_finan
DB_SERIES_NAME=animecre_series
```

### Configuración de Conexión por Módulo

```typescript
// Configuración base
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'animecream',
  password: process.env.DB_PASSWORD || 'animecream123',
  charset: 'utf8mb4',
  timezone: 'Z',
};

// Configuraciones específicas por módulo
const dbConfigs = {
  auth: { ...baseConfig, database: 'animecre_auth' },
  main: { ...baseConfig, database: 'animecre_cake514' },
  finan: { ...baseConfig, database: 'animecre_finan' },
  series: { ...baseConfig, database: 'animecre_series' },
};
```

## 📊 Optimizaciones de Base de Datos

### Índices Estratégicos

```sql
-- Índices para optimización de consultas
CREATE INDEX idx_productions_year ON productions(year);
CREATE INDEX idx_productions_visible ON productions(visible);
CREATE INDEX idx_movements_user_date ON movements(user_id, date_movement);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Configuración de Rendimiento

```sql
-- Configuración optimizada para MariaDB
SET innodb_buffer_pool_size = 256M;
SET max_connections = 100;
SET query_cache_size = 32M;
SET query_cache_type = 1;
```

## 🔄 Migraciones y Versionado

### Scripts de Migración

```
sql/
├── 00-create-module-databases.sql    # Crear todas las bases de datos
├── 01-setup-auth-module.sql          # Configurar módulo de autenticación
├── 02-setup-main-database.sql        # Configurar base de datos principal
├── 03-setup-finan-module.sql         # Configurar módulo financiero
├── 04-setup-series-module.sql        # Configurar módulo de series
└── 99-verify-databases.sql           # Verificar que todo se creó correctamente
```

### Migración de Seguridad

```sql
-- migration-add-security-fields.sql
-- Agregar campos de seguridad a la tabla users
ALTER TABLE users
ADD COLUMN login_attempts INT NOT NULL DEFAULT 0,
ADD COLUMN last_login DATETIME NULL,
ADD COLUMN locked_until DATETIME NULL;

-- Crear índices para optimización
CREATE INDEX idx_users_login_attempts ON users(login_attempts);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_locked_until ON users(locked_until);
```

## 🧪 Testing de Base de Datos

### Casos de Prueba

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

## 📊 Monitoreo y Métricas

### Métricas de Base de Datos

- **Connection Pool**: Número de conexiones activas
- **Query Performance**: Tiempo de ejecución de consultas
- **Database Size**: Tamaño de cada base de datos
- **Index Usage**: Uso de índices
- **Lock Contention**: Contención de bloqueos

### Herramientas de Monitoreo

```sql
-- Verificar estado de conexiones
SHOW PROCESSLIST;

-- Verificar uso de índices
SHOW INDEX FROM productions;

-- Verificar tamaño de bases de datos
SELECT
  table_schema,
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema LIKE 'animecre_%'
GROUP BY table_schema;
```

## 🚀 Escalabilidad

### Estrategias de Escalabilidad

1. **Horizontal Scaling**: Múltiples instancias de base de datos
2. **Read Replicas**: Réplicas de solo lectura
3. **Sharding**: Particionado por módulo
4. **Caching**: Caché de consultas frecuentes

### Configuración de Alta Disponibilidad

```yaml
# docker-compose.yml para producción
services:
  mariadb-master:
    image: mariadb:10.3.39
    environment:
      MYSQL_REPLICATION_MODE: master
      MYSQL_REPLICATION_USER: replicator
      MYSQL_REPLICATION_PASSWORD: replicator_password

  mariadb-slave:
    image: mariadb:10.3.39
    environment:
      MYSQL_REPLICATION_MODE: slave
      MYSQL_MASTER_HOST: mariadb-master
      MYSQL_REPLICATION_USER: replicator
      MYSQL_REPLICATION_PASSWORD: replicator_password
```

## 🔒 Seguridad de Base de Datos

### Medidas de Seguridad

1. **Encriptación**: Conexiones SSL/TLS
2. **Autenticación**: Usuarios y contraseñas seguras
3. **Autorización**: Permisos granulares
4. **Auditoría**: Registro de accesos y modificaciones

### Configuración de Seguridad

```sql
-- Crear usuario específico para cada módulo
CREATE USER 'animecream_auth'@'%' IDENTIFIED BY 'secure_password_auth';
CREATE USER 'animecream_finan'@'%' IDENTIFIED BY 'secure_password_finan';
CREATE USER 'animecream_series'@'%' IDENTIFIED BY 'secure_password_series';

-- Asignar permisos específicos
GRANT SELECT, INSERT, UPDATE, DELETE ON animecre_auth.* TO 'animecream_auth'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON animecre_finan.* TO 'animecream_finan'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON animecre_series.* TO 'animecream_series'@'%';
```

## 🐛 Troubleshooting

### Problemas Comunes

#### Error: "Base de datos no encontrada"

```bash
# Verificar que las bases de datos se crearon
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# Verificar scripts de inicialización
docker-compose logs mariadb
```

#### Error: "Conexión rechazada"

```bash
# Verificar que el contenedor esté ejecutándose
docker ps

# Verificar configuración de red
docker network ls
```

#### Error: "Permisos denegados"

```bash
# Verificar usuario y contraseña
# Verificar permisos de usuario
# Verificar configuración de autenticación
```

### Comandos de Diagnóstico

```bash
# Verificar estado de contenedores
docker-compose ps

# Ver logs detallados
docker-compose logs --tail=100 mariadb

# Acceder a la base de datos
docker exec -it animecream-mariadb mysql -u root -p

# Verificar configuración
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW VARIABLES;"
```

---

**Última actualización**: 2024-09-28

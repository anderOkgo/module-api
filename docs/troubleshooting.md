# Troubleshooting - Module-API

## 🐛 Guía de Solución de Problemas

Este documento proporciona soluciones para los problemas más comunes que pueden surgir durante el desarrollo, despliegue y uso del proyecto Module-API.

## 🔧 Problemas de Configuración

### Symlinks y Archivos en Producción

#### Error: "Archivos no se guardan en la ubicación correcta"

```bash
# Síntomas
# Los archivos se guardan en uploads/ pero no son accesibles desde la web
# Error 404 al intentar acceder a las imágenes

# Diagnóstico
# Verificar si existe el symlink
ls -l /home/animecre/info.animecream.com/uploads/series/img/ | grep tarjeta

# Si no existe o está roto, recrear el symlink
rm /home/animecre/info.animecream.com/uploads/series/img/tarjeta
ln -s /home/animecre/public_html/webroot/img/tarjeta /home/animecre/info.animecream.com/uploads/series/img/tarjeta

# Verificar que el symlink funciona
ls -l /home/animecre/info.animecream.com/uploads/series/img/tarjeta
```

#### Error: "Symlink roto o no existe"

```bash
# Síntomas
# ls -l muestra un archivo normal en lugar de un symlink
# Los archivos no se reflejan entre las carpetas

# Solución
# 1. Eliminar el archivo/carpeta existente
rm -rf /home/animecre/info.animecream.com/uploads/series/img/tarjeta

# 2. Crear el directorio de destino si no existe
mkdir -p /home/animecre/public_html/webroot/img/tarjeta

# 3. Crear el symlink
ln -s /home/animecre/public_html/webroot/img/tarjeta /home/animecre/info.animecream.com/uploads/series/img/tarjeta

# 4. Verificar permisos
chmod 755 /home/animecre/public_html/webroot/img/tarjeta
chown animecre:animecre /home/animecre/public_html/webroot/img/tarjeta
```

#### Error: "Permisos de archivos incorrectos"

```bash
# Síntomas
# Error 403 al acceder a las imágenes
# Archivos no se pueden escribir

# Solución
# Configurar permisos correctos
chmod 755 /home/animecre/public_html/webroot/img/tarjeta
chmod 644 /home/animecre/public_html/webroot/img/tarjeta/*
chown -R animecre:animecre /home/animecre/public_html/webroot/img/tarjeta

# Verificar permisos
ls -la /home/animecre/public_html/webroot/img/tarjeta
```

#### Verificación de Configuración de Symlinks

```bash
# Script de verificación completo
#!/bin/bash

echo "=== Verificación de Symlinks ==="

# Verificar que el directorio de destino existe
if [ -d "/home/animecre/public_html/webroot/img/tarjeta" ]; then
    echo "✅ Directorio de destino existe"
else
    echo "❌ Directorio de destino no existe"
    mkdir -p /home/animecre/public_html/webroot/img/tarjeta
    echo "✅ Directorio de destino creado"
fi

# Verificar que el symlink existe
if [ -L "/home/animecre/info.animecream.com/uploads/series/img/tarjeta" ]; then
    echo "✅ Symlink existe"

    # Verificar que el symlink apunta al lugar correcto
    TARGET=$(readlink /home/animecre/info.animecream.com/uploads/series/img/tarjeta)
    if [ "$TARGET" = "/home/animecre/public_html/webroot/img/tarjeta" ]; then
        echo "✅ Symlink apunta al lugar correcto"
    else
        echo "❌ Symlink apunta a: $TARGET"
        echo "   Debería apuntar a: /home/animecre/public_html/webroot/img/tarjeta"
    fi
else
    echo "❌ Symlink no existe"
    echo "Creando symlink..."
    ln -s /home/animecre/public_html/webroot/img/tarjeta /home/animecre/info.animecream.com/uploads/series/img/tarjeta
    echo "✅ Symlink creado"
fi

# Verificar permisos
echo "=== Verificación de Permisos ==="
ls -la /home/animecre/public_html/webroot/img/tarjeta
ls -la /home/animecre/info.animecream.com/uploads/series/img/

echo "=== Verificación Completada ==="
```

### Node.js y NPM

#### Error: "Node.js versión incorrecta"

```bash
# Síntomas
node: command not found
# o
Error: Node.js version mismatch

# Solución
# Instalar nvm si no está instalado
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar y usar Node.js 12.22.9
nvm install 12.22.9
nvm use 12.22.9

# Verificar instalación
node --version  # Debe mostrar v12.22.9
npm --version
```

#### Error: "Dependencias no instaladas"

```bash
# Síntomas
Error: Cannot find module 'express'
# o
npm ERR! peer dep missing

# Solución
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstalar dependencias
npm install

# Si persiste, usar npm ci
npm ci
```

### Docker

#### Error: "Docker Desktop no ejecutándose"

```bash
# Síntomas
docker: command not found
# o
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/v1.47/containers/json?all=1&filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.project%3Ddocker%22%3Atrue%7D%7D": open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.

# Solución
# 1. Iniciar Docker Desktop desde el menú de inicio
# 2. Esperar a que aparezca el ícono de Docker en la bandeja del sistema
# 3. Verificar que Docker esté ejecutándose
docker --version
docker ps
```

#### Error: "Puerto ya en uso"

```bash
# Síntomas
Error: listen EADDRINUSE: address already in use :::3306
# o
Error: listen EADDRINUSE: address already in use :::3001

# Solución
# Verificar qué proceso está usando el puerto
sudo lsof -i :3306
sudo lsof -i :3001

# Matar proceso si es necesario
sudo kill -9 <PID>

# O cambiar puerto en docker-compose.yml
ports:
  - "3307:3306"  # Cambiar 3307 por otro puerto disponible
```

#### Error: "Contenedor no inicia"

```bash
# Síntomas
docker-compose up -d
# No hay output o error

# Solución
# Ver logs para identificar el problema
docker-compose logs mariadb

# Reconstruir contenedor
docker-compose down
docker-compose up -d --build

# Verificar estado de contenedores
docker-compose ps
```

## 🗄️ Problemas de Base de Datos

### Conexión a Base de Datos

#### Error: "Base de datos no accesible"

```bash
# Síntomas
Error: connect ECONNREFUSED 127.0.0.1:3306
# o
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'animecream'@'localhost'

# Solución
# 1. Verificar que el contenedor esté ejecutándose
docker ps

# 2. Verificar logs
docker-compose logs mariadb

# 3. Reiniciar contenedor
docker-compose restart mariadb

# 4. Verificar configuración de conexión
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"
```

#### Error: "Base de datos no encontrada"

```bash
# Síntomas
Error: Unknown database 'animecre_auth'
# o
Error: Unknown database 'animecre_finan'

# Solución
# 1. Verificar que las bases de datos se crearon
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"

# 2. Verificar scripts de inicialización
docker-compose logs mariadb

# 3. Recrear contenedor si es necesario
docker-compose down -v
docker-compose up -d --build
```

#### Error: "Tabla no encontrada"

```bash
# Síntomas
Error: Table 'animecre_auth.users' doesn't exist
# o
Error: Table 'animecre_finan.movements' doesn't exist

# Solución
# 1. Verificar que las tablas se crearon
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; SHOW TABLES;"

# 2. Verificar scripts SQL
docker exec -it animecream-mariadb ls -la /docker-entrypoint-initdb.d/

# 3. Recrear contenedor si es necesario
docker-compose down -v
docker-compose up -d --build
```

### Errores SQL

#### Error: "Campo no encontrado"

```bash
# Síntomas
Error: Unknown column 'login_attempts' in 'field list'
# o
Error: Unknown column 'last_login' in 'field list'

# Solución
# 1. Ejecutar migración de seguridad
docker exec -i animecream-mariadb mysql -u root -p animecre_auth < migration-add-security-fields.sql

# 2. Verificar que los campos se agregaron
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; DESCRIBE users;"
```

#### Error: "Error de sintaxis SQL"

```bash
# Síntomas
Error: ER_PARSE_ERROR: You have an error in your SQL syntax
# o
Error: ER_WRONG_FIELD_WITH_GROUP: Expression #1 of SELECT list is not in GROUP BY clause

# Solución
# 1. Verificar que los stored procedures existen
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_finan; SHOW PROCEDURE STATUS;"

# 2. Recrear stored procedures si es necesario
docker exec -i animecream-mariadb mysql -u root -p animecre_finan < db-financial-procedures.sql
```

## 🚀 Problemas del Servidor

### Inicio del Servidor

#### Error: "Puerto ya en uso"

```bash
# Síntomas
Error: listen EADDRINUSE: address already in use :::3001
# o
Error: listen EADDRINUSE: address already in use :::3000

# Solución
# 1. Verificar qué proceso está usando el puerto
sudo lsof -i :3001
sudo lsof -i :3000

# 2. Matar proceso si es necesario
sudo kill -9 <PID>

# 3. O cambiar puerto en .env
PORT=3002
```

#### Error: "Módulo no encontrado"

```bash
# Síntomas
Error: Cannot find module 'express'
# o
Error: Cannot find module './modules/auth/application/user.controller'

# Solución
# 1. Verificar que las dependencias estén instaladas
npm install

# 2. Verificar que el archivo existe
ls -la src/modules/auth/application/user.controller.ts

# 3. Recompilar si es necesario
npm run build
```

#### Error: "Error de compilación TypeScript"

```bash
# Síntomas
error TS2307: Cannot find module
# o
error TS2554: Expected 1 arguments, but got 0

# Solución
# 1. Verificar que los tipos están instalados
npm install --save-dev @types/node @types/express

# 2. Verificar configuración de TypeScript
npx tsc --noEmit

# 3. Limpiar y recompilar
rm -rf dist/
npm run build
```

### API Endpoints

#### Error: "Cannot POST /api/users/login"

```bash
# Síntomas
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Error</title>
</head>
<body>
    <pre>Cannot POST /api/users/login</pre>
</body>
</html>

# Solución
# 1. Verificar que las rutas están configuradas correctamente
# 2. Verificar que el servidor está ejecutándose
curl http://localhost:3001/health

# 3. Verificar logs del servidor
npm run dev
```

#### Error: "Ruta no encontrada"

```bash
# Síntomas
Error: Cannot GET /api/series
# o
Error: Cannot POST /api/finan/initial-load

# Solución
# 1. Verificar que las rutas están registradas en server.ts
# 2. Verificar que los controladores existen
# 3. Verificar que los métodos HTTP son correctos
```

## 🖼️ Problemas de Imágenes

### Upload de Imágenes

#### Error: "Archivo no encontrado"

```bash
# Síntomas
Error: ENOENT: no such file or directory, open 'uploads/series/img/tarjeta/image.jpg'
# o
Error: Cannot read property 'filename' of undefined

# Solución
# 1. Verificar que el directorio existe
mkdir -p uploads/series/img/tarjeta

# 2. Verificar permisos de escritura
chmod 755 uploads/series/img/tarjeta

# 3. Verificar que el archivo se subió correctamente
ls -la uploads/series/img/tarjeta/
```

#### Error: "Tipo de archivo no válido"

```bash
# Síntomas
Error: Invalid file type
# o
Error: Only image files are allowed

# Solución
# 1. Verificar que el archivo es una imagen
file image.jpg

# 2. Verificar que el tipo MIME es correcto
# 3. Verificar configuración de Multer
```

#### Error: "Optimización de imagen fallida"

```bash
# Síntomas
Error: Input file is missing
# o
Error: Cannot process image

# Solución
# 1. Verificar que Sharp está instalado
npm list sharp

# 2. Reinstalar Sharp si es necesario
npm uninstall sharp
npm install sharp

# 3. Verificar que el archivo de imagen es válido
```

## 🔐 Problemas de Autenticación

### JWT Tokens

#### Error: "Token inválido"

```bash
# Síntomas
Error: jwt malformed
# o
Error: jwt expired

# Solución
# 1. Verificar que el token no ha expirado
# 2. Verificar que el token está bien formado
# 3. Verificar que la clave secreta es correcta
```

#### Error: "Usuario no encontrado"

```bash
# Síntomas
Error: User not found
# o
Error: Invalid credentials

# Solución
# 1. Verificar que el usuario existe en la base de datos
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; SELECT * FROM users;"

# 2. Verificar que las credenciales son correctas
# 3. Verificar que el usuario está activo
```

#### Error: "Cuenta bloqueada"

```bash
# Síntomas
Error: Account locked
# o
Error: Too many login attempts

# Solución
# 1. Verificar estado de la cuenta
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; SELECT login_attempts, locked_until FROM users WHERE email='user@example.com';"

# 2. Desbloquear cuenta si es necesario
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_auth; UPDATE users SET login_attempts=0, locked_until=NULL WHERE email='user@example.com';"
```

## 📊 Problemas de Rendimiento

### Lentitud en Consultas

#### Error: "Consulta lenta"

```bash
# Síntomas
Query took too long to execute
# o
Database timeout

# Solución
# 1. Verificar índices en la base de datos
docker exec -it animecream-mariadb mysql -u root -p -e "USE animecre_series; SHOW INDEX FROM productions;"

# 2. Optimizar consultas
# 3. Verificar configuración de la base de datos
```

#### Error: "Memoria insuficiente"

```bash
# Síntomas
Error: out of memory
# o
Error: Cannot allocate memory

# Solución
# 1. Verificar uso de memoria
free -h

# 2. Aumentar memoria si es necesario
# 3. Optimizar consultas para usar menos memoria
```

### Problemas de Carga

#### Error: "Servidor sobrecargado"

```bash
# Síntomas
Error: Too many connections
# o
Error: Server overloaded

# Solución
# 1. Verificar número de conexiones
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW PROCESSLIST;"

# 2. Aumentar límite de conexiones
# 3. Implementar load balancing
```

## 🔍 Herramientas de Diagnóstico

### Comandos Útiles

```bash
# Verificar estado del sistema
systemctl status nginx
systemctl status docker

# Verificar logs
journalctl -u nginx -f
journalctl -u docker -f

# Verificar recursos
htop
df -h
free -h

# Verificar red
netstat -tulpn
ss -tulpn
```

### Scripts de Diagnóstico

```bash
#!/bin/bash
# diagnose.sh

echo "=== System Information ==="
uname -a
free -h
df -h

echo "=== Docker Status ==="
docker --version
docker ps
docker-compose ps

echo "=== Node.js Status ==="
node --version
npm --version

echo "=== Application Status ==="
curl -f http://localhost:3001/health || echo "Application not responding"
curl -f http://localhost:3001/api || echo "API not responding"

echo "=== Database Status ==="
docker exec animecream-mariadb mysql -u root -p -e "SHOW DATABASES;" || echo "Database not accessible"
```

## 📞 Soporte

### Recursos de Ayuda

- **Documentación**: [docs/README.md](README.md)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/module-api/issues)
- **Email**: soporte@ejemplo.com

### Información para Reportar Bugs

Al reportar un bug, incluye:

1. **Descripción del problema**
2. **Pasos para reproducir**
3. **Logs de error**
4. **Configuración del sistema**
5. **Versiones de software**

### Ejemplo de Reporte

```
**Problema**: Error al subir imagen
**Descripción**: Al intentar subir una imagen, obtengo el error "Cannot process image"
**Pasos para reproducir**:
1. Ir a /api/series
2. Seleccionar archivo de imagen
3. Hacer clic en "Subir"
**Logs**:
Error: Input file is missing
    at ImageProcessor.optimizeImage
**Sistema**: Windows 10, Node.js 12.22.9, Docker Desktop
```

---

**Última actualización**: 2024-09-28

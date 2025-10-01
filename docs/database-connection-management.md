# 🔌 Gestión de Conexiones de Base de Datos

## 🎯 **Problema Resuelto**

### **❌ Antes:**

```
Error: Connection lost: The server closed the connection.
PROTOCOL_CONNECTION_LOST
```

**Problemas:**

- ❌ No había manejo de reconexión automática
- ❌ Ctrl+C no cerraba limpiamente la aplicación
- ❌ `Terminate batch job (Y/N)?` bloqueaba la terminal
- ❌ App se crasheaba sin recuperación

### **✅ Ahora:**

- ✅ Reconexión automática cuando se pierde la conexión
- ✅ Manejo de errores fatales de MySQL
- ✅ Graceful shutdown con Ctrl+C
- ✅ Terminal responde correctamente
- ✅ Cierre limpio de recursos

---

## 🔧 **Implementación**

### **1. Reconexión Automática (database.ts)**

```typescript
class Database {
  private reconnecting: boolean = false;

  private setupConnectionHandlers(): void {
    this.connection.on('error', (err: MysqlError) => {
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('⚠️  Connection lost. Attempting to reconnect...');
        this.handleDisconnect();
      }
    });
  }

  private handleDisconnect(): void {
    if (this.reconnecting) return;

    this.reconnecting = true;
    setTimeout(() => {
      console.log('🔄 Reconnecting to MySQL...');
      this.connection = mysql.createConnection(this.config);
      this.setupConnectionHandlers();
      this.connection.connect((err) => {
        this.reconnecting = false;
        if (err) {
          this.handleDisconnect(); // Retry
        } else {
          console.log('✅ Reconnected successfully!');
        }
      });
    }, 2000);
  }
}
```

**Características:**

- **Detección de desconexión**: Escucha eventos de error
- **Reconexión automática**: Intenta reconectar cada 2 segundos
- **Prevención de loops**: Flag `reconnecting` evita múltiples intentos simultáneos
- **Retry infinito**: Sigue intentando hasta recuperar la conexión

---

### **2. Graceful Shutdown (server.ts)**

```typescript
class Server {
  private setupGracefulShutdown(): void {
    // Ctrl+C
    process.on('SIGINT', async () => {
      console.log('\n⚠️  SIGINT received. Starting graceful shutdown...');
      await this.shutdown();
    });

    // Terminación del proceso
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  SIGTERM received. Starting graceful shutdown...');
      await this.shutdown();
    });

    // Errores no capturados
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Uncaught Exception:', error);
      this.shutdown().then(() => process.exit(1));
    });
  }

  private async shutdown(): Promise<void> {
    // Timeout de seguridad (5 segundos)
    const forceTimeout = setTimeout(() => {
      console.log('⚠️  Force closing after timeout...');
      process.exit(0);
    }, 5000);

    try {
      // 1. Cerrar servidor HTTP (con await)
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
          this.server.closeAllConnections(); // Forzar cierre de conexiones
        });
        console.log('✅ HTTP server closed');
      }

      // 2. Cerrar conexión de base de datos
      if (this.database) {
        await this.database.close();
        console.log('✅ Database connection closed');
      }

      clearTimeout(forceTimeout);
      console.log('👋 Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceTimeout);
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}
```

**Características:**

- **SIGINT (Ctrl+C)**: Cierre limpio cuando el usuario interrumpe
- **SIGTERM**: Cierre limpio cuando el sistema termina el proceso
- **uncaughtException**: Manejo de errores no capturados
- **unhandledRejection**: Manejo de promesas rechazadas
- **Cierre ordenado**: HTTP → Database → Exit
- **Timeout de seguridad**: Fuerza el cierre después de 5 segundos si algo falla
- **closeAllConnections()**: Fuerza el cierre de todas las conexiones HTTP activas
- **Try-catch**: Manejo robusto de errores durante el shutdown

---

## 📊 **Escenarios Manejados**

| Escenario                 | Antes                         | Ahora                        |
| ------------------------- | ----------------------------- | ---------------------------- |
| **MySQL se desconecta**   | ❌ App crash                  | ✅ Reconecta automáticamente |
| **Ctrl+C en la terminal** | ❌ Terminal se bloquea        | ✅ Cierre limpio inmediato   |
| **Error fatal de MySQL**  | ❌ App crash sin recuperación | ✅ Reconecta automáticamente |
| **Timeout de conexión**   | ❌ App deja de responder      | ✅ Reconecta y continúa      |
| **Error no capturado**    | ❌ App crash                  | ✅ Shutdown graceful         |

---

## 🚀 **Uso**

### **Iniciar la aplicación:**

```bash
npm start
```

**Salida esperada:**

```
🚀 App running on port 3001
📚 Swagger docs available at http://localhost:3001/api-docs
✅ Connected to MySQL successfully!
```

### **Si MySQL se desconecta:**

```
⚠️  Connection lost. Attempting to reconnect...
🔄 Reconnecting to MySQL...
✅ Reconnected to MySQL successfully!
```

### **Detener la aplicación (Ctrl+C):**

```
^C
⚠️  SIGINT received. Starting graceful shutdown...
🔄 Closing HTTP server...
✅ HTTP server closed
🔄 Closing database connection...
✅ Database connection closed
👋 Graceful shutdown complete
```

---

## ⚙️ **Configuración**

### **Tiempo de reconexión:**

Puedes ajustar el delay en `database.ts`:

```typescript
setTimeout(() => {
  // Reconectar...
}, 2000); // 2 segundos (ajustable)
```

### **Reintentos de reconexión:**

Por defecto, intenta **infinitamente** hasta recuperar la conexión. Para limitar:

```typescript
private reconnectAttempts = 0;
private maxReconnectAttempts = 5; // Máximo 5 intentos

private handleDisconnect(): void {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    console.error('❌ Max reconnection attempts reached');
    process.exit(1);
  }
  this.reconnectAttempts++;
  // ... resto del código
}
```

---

## 🎉 **Beneficios**

### **✅ Estabilidad:**

- La aplicación **no se cae** por desconexiones temporales
- Recuperación automática sin intervención manual

### **✅ UX del Desarrollador:**

- Ctrl+C funciona **inmediatamente**
- **No más `Terminate batch job (Y/N)?`**
- Terminal queda **lista para usar**

### **✅ Producción:**

- Resistente a problemas de red
- Logs claros de reconexión
- Cierre limpio de recursos

### **✅ Debugging:**

- Mensajes descriptivos con emojis
- Fácil identificar estado de la aplicación
- Logs de conexión/desconexión

---

## 🔍 **Logs de Diagnóstico**

### **Conexión exitosa:**

```
✅ Connected to MySQL successfully!
```

### **Error de conexión:**

```
MySQL connection error: Error: Connection lost
⚠️  Connection lost. Attempting to reconnect...
```

### **Reconexión en progreso:**

```
🔄 Reconnecting to MySQL...
✅ Reconnected to MySQL successfully!
```

### **Cierre limpio:**

```
⚠️  SIGINT received. Starting graceful shutdown...
🔄 Closing HTTP server...
✅ HTTP server closed
🔄 Closing database connection...
✅ Database connection closed
👋 Graceful shutdown complete
```

---

## 📝 **Notas Importantes**

1. **Reconexión automática**: Solo funciona para conexiones perdidas, no para errores de autenticación
2. **Timeout de consultas**: Consultas en progreso durante la desconexión fallarán
3. **Pool de conexiones**: Para mayor robustez, considera usar `mysql.createPool()` en lugar de `createConnection()`
4. **Monitoring**: Considera agregar logging a servicios externos (Sentry, CloudWatch, etc.)

---

## 🎯 **Resultado Final**

**¡La aplicación ahora es resistente a desconexiones y se cierra limpiamente!**

- ✅ Sin más crashes por `PROTOCOL_CONNECTION_LOST`
- ✅ Terminal responde correctamente a Ctrl+C
- ✅ Reconexión automática transparente
- ✅ Logs claros y descriptivos
- ✅ Código profesional y robusto

import dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Database } from './infrastructure/my.database.helper';

// Cargar variables de entorno
dotenv.config();
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/services/swagger';
import { buildSeriesModule } from './modules/series/infrastructure/config/series.module';
// Removed default routes - using direct endpoint
import { buildAuthModule } from './modules/auth/infrastructure/config/auth.module';
import { buildFinanModule } from './modules/finan/infrastructure/config/finan.module';

class Server {
  public app: Application;
  private port: string;
  private server: any;
  private database: Database | null = null;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || '3000';
    this.middlewares();
    this.routes();
    this.connectDB();
    this.listening();
    this.setupGracefulShutdown();
  }

  private listening() {
    this.server = this.app.listen(this.port, () => {
      console.log('🚀 App running on port', this.port);
      console.log(`📚 Swagger docs available at http://localhost:${this.port}/api-docs`);
    });
  }

  private async connectDB() {
    try {
      this.database = new Database('MYDATABASEANIME');
      await this.database.open();
    } catch (error) {
      console.error('❌ Database connection failed', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    // Manejo de Ctrl+C (SIGINT)
    process.on('SIGINT', async () => {
      console.log('\n⚠️  SIGINT received. Starting graceful shutdown...');
      await this.shutdown();
    });

    // Manejo de terminación (SIGTERM)
    process.on('SIGTERM', async () => {
      console.log('\n⚠️  SIGTERM received. Starting graceful shutdown...');
      await this.shutdown();
    });

    // Manejo de errores no capturados
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Uncaught Exception:', error);
      this.shutdown().then(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason: any) => {
      console.error('❌ Unhandled Rejection:', reason);
      this.shutdown().then(() => process.exit(1));
    });
  }

  private async shutdown(): Promise<void> {
    console.log('🔄 Closing HTTP server...');

    // Timeout de 5 segundos para forzar el cierre
    const forceTimeout = setTimeout(() => {
      console.log('⚠️  Force closing after timeout...');
      process.exit(0);
    }, 5000);

    try {
      // Cerrar servidor HTTP con Promise
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((err: any) => {
            if (err) {
              console.error('❌ Error closing HTTP server:', err);
              reject(err);
            } else {
              console.log('✅ HTTP server closed');
              resolve();
            }
          });

          // Destruir todas las conexiones activas inmediatamente
          this.server.closeAllConnections();
        });
      }

      // Cerrar conexión de base de datos
      if (this.database) {
        console.log('🔄 Closing database connection...');
        try {
          await this.database.close();
          console.log('✅ Database connection closed');
        } catch (error) {
          console.error('❌ Error closing database:', error);
        }
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

  private routes() {
    this.app.use(cors({ origin: '*' }));

    // Swagger documentation
    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Animecream API Documentation',
      })
    );

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      this.healthCheck(req, res);
    });

    // Default API status endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({ msg: 'API Working' });
    });

    this.app.get('/api', (req: Request, res: Response) => {
      res.json({ msg: 'API Working' });
    });
    // Usando CQRS en lugar del módulo antiguo
    this.app.use('/api/series', buildSeriesModule().router);
    this.app.use('/api/users', buildAuthModule().router);
    this.app.use('/api/finan', buildFinanModule().router);
    this.app.use(this.errorHandlerMiddleware);
  }

  private middlewares() {
    this.app.use(express.json());
  }

  private errorHandlerMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({ error: 'Bad Request: Invalid JSON' });
    }
    if (err.message === 'Not Found') {
      return res.status(404).json({ error: 'Not Found' });
    }
    if (err.message === 'Method Not Allowed') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.error('Internal Server Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  private async healthCheck(req: Request, res: Response) {
    try {
      const healthStatus = {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.9',
        services: {
          database: 'UP',
          api: 'UP',
        },
      };

      // Verificar conexión a base de datos
      try {
        const db = new Database('MYDATABASE');
        await db.testConnection();
        healthStatus.services.database = 'UP';
      } catch (error) {
        healthStatus.status = 'DOWN';
        healthStatus.services.database = 'DOWN';
        (healthStatus.services as any).database_error = error instanceof Error ? error.message : 'Unknown error';
      }

      const statusCode = healthStatus.status === 'UP' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default Server;

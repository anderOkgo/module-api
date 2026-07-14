import dotenv from 'dotenv';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import { Database } from './infrastructure/my.database.helper';

// Load environment variables
dotenv.config();
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/services/swagger';
import { buildSeriesModule } from './modules/series/infrastructure/config/series.module';
import { buildAuthModule } from './modules/auth/infrastructure/config/auth.module';
import { buildFinanModule } from './modules/finan/infrastructure/config/finan.module';

/**
 * Builds the fully-wired Express app (middleware, routes, error handler) with
 * no bootstrap side effects — no DB connection, no listen(). Exported
 * standalone so it can be constructed in tests with a mocked Database.
 */
export function buildApp(database: Database): Application {
  const app = express();

  app.use(compression());
  app.use(express.json());
  app.use(cors({ origin: '*' }));

  // Swagger documentation
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Animecream API Documentation',
    })
  );

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    healthCheck(database, req, res);
  });

  // Default API status endpoint. Also pinged by the keep-alive cron, so it
  // touches the DB pool to keep pooled connections from going stale/idle.
  app.get('/', async (req: Request, res: Response) => {
    try {
      await database.testConnection();
    } catch (error) {
      console.error('Keep-alive DB ping failed:', error instanceof Error ? error.message : error);
    }
    res.json({ msg: 'API Working' });
  });

  app.get('/api', (req: Request, res: Response) => {
    res.json({ msg: 'API Working' });
  });

  app.use('/api/series', buildSeriesModule().router);
  app.use('/api/users', buildAuthModule().router);
  app.use('/api/finan', buildFinanModule().router);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use(errorHandlerMiddleware);

  return app;
}

export function errorHandlerMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Bad Request: Invalid JSON' });
  }

  console.error('Internal Server Error:', err);
  return res.status(500).json({ error: 'Internal Server Error' });
}

export async function healthCheck(database: Database, req: Request, res: Response): Promise<void> {
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

    // Check database connection
    try {
      await database.testConnection();
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

class Server {
  public app: Application;
  private server: any;
  private port: string;
  private database: Database;

  constructor() {
    this.port = process.env.PORT || '3000';
    this.database = new Database('MYDATABASEANIME');
    this.app = buildApp(this.database);
    this.connectDB();
    this.listening();
  }

  private listening() {
    this.server = this.app.listen(this.port, () => {
      console.log('🚀 App running on port', this.port);
      console.log(`📚 Swagger docs available at http://localhost:${this.port}/api-docs`);
    });
  }

  private async connectDB() {
    try {
      await this.database.open();
    } catch (error) {
      console.error('Database connection failed', error);
      process.exit(1);
    }
  }
}

export default Server;

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Database } from './infrastructure/my.database.helper';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/lib/swagger';
import routesSeries from './modules/series/infrastructure/routes/series.routes';
// Removed default routes - using direct endpoint
import routesUser from './modules/auth/infrastructure/routes/user.routes';
import routesFinan from './modules/finan/infrastructure/routes/finan.routes';

class Server {
  public app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || '3000';
    this.middlewares();
    this.routes();
    this.connectDB();
    this.listening();
  }

  private listening() {
    this.app.listen(this.port, () => console.log('App running on port', this.port));
  }

  private async connectDB() {
    try {
      const database: Database = new Database('MYDATABASEANIME');
      await database.open();
    } catch (error) {
      console.error('Database connection failed', error);
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
    this.app.use('/api/series', routesSeries);
    this.app.use('/api/users', routesUser);
    this.app.use('/api/finan', routesFinan);
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

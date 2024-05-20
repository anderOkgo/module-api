import { express, Application, Request, Response, NextFunction } from './helpers/middle.helper';
import { Database } from './helpers/my.database.helper';
import routesSeries from './app/series/application/series.routes';
import routesDefault from './app/default/application/default.routes';
import routesUser from './app/auth/application/user.routes';
import routesFinan from './app/finan/application/finan.routes';
import { cors } from './helpers/cors.helper';

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
    this.app.use('/', routesDefault);
    this.app.use('/api', routesDefault);
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
}

export default Server;

import express, { Application } from 'express';
import { Database } from './helpers/my.database.helper';
import routesSeries from './app/series/application/series.routes';
import routesDefault from './app/default/application/default.routes';
import routesUser from './app/auth/application/user.routes';
import routesFinan from './app/finan/application/finan.routes';
import cors from 'cors';
import cron from 'node-cron';

class server {
  public app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || '3000';
    this.listening();
    this.connectDB();
    this.midlewares();
    this.routes();
    this.init();
  }

  listening = () => this.app.listen(this.port, () => console.log('app running port', this.port));

  connectDB() {
    const database: Database = new Database('MYDATABASEANIME');
    database.open();
    database.close();
  }

  routes() {
    this.app.use(cors({ origin: '*' }));
    this.app.use('/', routesDefault);
    this.app.use('/api', routesDefault);
    this.app.use('/api/series', routesSeries);
    this.app.use('/api/users', routesUser);
    this.app.use('/api/finan', routesFinan);
  }

  init() {
    cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Request successful');
      } catch (error) {
        console.error('Error message');
      }
    });
  }

  midlewares = () => this.app.use(express.json());
}

export default server;

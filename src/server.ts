import express, { Application } from 'express';
import { Database } from './helpers/my.database.helper';
import routesProduction from './app/series/application/series.routes';
import routesDefault from './app/default/application/default.routes';
import routesUser from './app/auth/application/user.routes';
import routesFinan from './app/finan/application/finan.routes';
import cors from 'cors';

class server {
  private app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || '3000';
    this.listening();
    this.connectDB();
    this.midlewares();
    this.routes();
  }

  listening = () => this.app.listen(this.port, () => console.log('app running port', this.port));

  connectDB() {
    const database: any = new Database('MYDATABASEANIME');
    database.open();
    database.close();
  }

  routes() {
    this.app.use(cors({ origin: '*' }));
    this.app.use('/', routesDefault);
    this.app.use('/api/series', routesProduction);
    this.app.use('/api/users', routesUser);
    this.app.use('/api/finan', routesFinan);
  }

  midlewares = () => this.app.use(express.json());
}

export default server;

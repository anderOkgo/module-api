import express, { Application } from 'express';
import connection from './data/mysql/database';
import routesProduction from './app/production/application/production.routes';
import routesDefault from './app/default/application/default.routes';
import routesUser from './app/auth/application/user.routes';
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
    const database: any = new connection();
    database.open();
    database.close();
  }

  routes() {
    this.app.use(cors({ origin: '*' }));
    this.app.use('/', routesDefault);
    this.app.use('/api/productions', routesProduction);
    this.app.use('/api/productions/years', routesProduction);
    this.app.use('/api/user', routesUser);
  }

  midlewares = () => this.app.use(express.json());
}

export default server;

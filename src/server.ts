import express, { Application } from 'express';
import connection from './data/mysql/connection';
import routesProduction from './usecases/production/application/production.routes';
import routesDefault from './usecases/default/application/default.routes';
import routesUser from './usecases/auth/application/user.routes';
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
  listening() {
    this.app.listen(this.port, () => {
      console.log('app running port', this.port);
    });
  }

  connectDB() {
    connection.connect((err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Database conneted successfull');
      }
    });
  }

  routes() {
    this.app.use(
      cors({
        origin: '*',
      })
    );
    this.app.use('/', routesDefault);
    this.app.use('/api/productions', routesProduction);
    this.app.use('/api/productions/years', routesProduction);
    this.app.use('/api/user', routesUser);
  }

  midlewares() {
    this.app.use(express.json());
  }
}

export default server;

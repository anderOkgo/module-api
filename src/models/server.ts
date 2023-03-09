import express, { Application } from 'express';
import dotenv from 'dotenv';
import connection from '../db/connection';
import routesProducto from '../routes/production.route';
import routesDefault from '../routes/default.routes';
import routesUsuario from '../routes/usuario.routes';

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
    this.app.use('/', routesDefault);
    this.app.use('/api/productions', routesProducto);
    this.app.use('/api/usuarios', routesUsuario);
  }

  midlewares() {
    this.app.use(express.json());
  }
}

export default server;

import express, { Application } from 'express';
import { Database } from './helpers/my.database.helper';
import routesSeries from './app/series/application/series.routes';
import routesDefault from './app/default/application/default.routes';
import routesUser from './app/auth/application/user.routes';
import routesFinan from './app/finan/application/finan.routes';
import cors from 'cors';
import cron from 'node-cron';
import axios from 'axios';

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
    const urlToRequest = 'https://info.animecream.com';
    cron.schedule('*/3 * * * *', async () => {
      try {
        const response = await axios.get(urlToRequest);
        const fs = require('fs');
        const textToWrite = response.data.msg;
        const filePath = 'init.txt';
        //fs.writeFileSync(filePath, textToWrite);
        fs.appendFileSync(filePath, textToWrite + '\n', 'utf-8');
        console.log(`Request to ${urlToRequest} successful. Response:`, response.data);
      } catch (error) {
        console.error(`Error making request to ${urlToRequest}:`, error);
      }
    });
  }

  midlewares = () => this.app.use(express.json());
}

export default server;

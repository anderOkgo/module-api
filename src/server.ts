import express, { Application, Request, Response, NextFunction } from 'express';
import { Database } from './helpers/my.database.helper';
import routesSeries from './app/series/application/series.routes';
import routesDefault from './app/default/application/default.routes';
import routesUser from './app/auth/application/user.routes';
import routesFinan from './app/finan/application/finan.routes';
import cors from 'cors';
import cron from 'node-cron';
import axios from 'axios';

class Server {
  public app: Application;
  private port: string;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || '3000';
    this.listening();
    this.connectDB();
    this.middlewares();
    this.routes();
    this.init();
  }

  private listening() {
    this.app.listen(this.port, () => console.log('app running port', this.port));
  }

  private connectDB() {
    const database: Database = new Database('MYDATABASEANIME');
    database.open();
    database.close();
  }

  private routes() {
    this.app.use(cors({ origin: '*' }));
    this.app.use('/', routesDefault);
    this.app.use('/api', routesDefault);
    this.app.use('/api/series', routesSeries);
    this.app.use('/api/users', routesUser);
    this.app.use('/api/finan', routesFinan);
  }

  private init() {
    const urlToRequest = 'https://info.animecream.com';
    cron.schedule('*/3 * * * *', async () => {
      try {
        const response = await axios.get(urlToRequest);
        const fs = require('fs');
        const textToWrite = response.data.msg;
        const filePath = 'init.txt';
        fs.writeFileSync(filePath, textToWrite);
        console.log(`Request to ${urlToRequest} successful. Response:`, response.data);
      } catch (error) {
        console.error(`Error making request to ${urlToRequest}:`, error);
      }
    });
  }

  private middlewares() {
    this.app.use(express.json());
    this.app.use(this.errorHandlerMiddleware);
  }

  private errorHandlerMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof SyntaxError && 'body' in err) {
      // Handle JSON parse errors (e.g., invalid JSON in request body)
      return res.status(400).json({ error: 'Bad Request: Invalid JSON' });
    }
    // Route not found (404)
    if (err instanceof Error && err.message === 'Not Found') {
      res.status(404).json({ error: 'Not Found' });
    }
    // Method not allowed (405)
    else if (err instanceof Error && err.message === 'Method Not Allowed') {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
    // Internal server error (500)
    else {
      console.error('Internal Server Error:', err);
      return res.status(400).json({ error: 'Bad Request' });
    }
  }
}

export default Server;

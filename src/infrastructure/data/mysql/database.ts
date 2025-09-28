import mysql, { Connection, MysqlError } from 'mysql';
import dotenv from 'dotenv';
import sendEmail from '../../../infrastructure/lib/email';

class Database {
  private connection: Connection;

  constructor(dbName: string) {
    dotenv.config();
    this.connection = mysql.createConnection({
      host: process.env.MYHOST!,
      user: process.env.MYUSER!,
      password: process.env.MYPASSWORD!,
      database: process.env[dbName]!,
      port: parseInt(process.env.MYPORT!, 10),
    });
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.connect((err?: MysqlError) => {
        if (err) {
          reject(new Error(`Error connecting to MySQL: ${err.message}`));
        } else {
          console.log('Connected to MySQL successfully!');
          resolve();
        }
      });
    });
  }

  async executeSafeQuery(query: string, params: any = {}): Promise<any> {
    try {
      return await this.executeQuery(query, params);
    } catch (error) {
      const emailAddress = process.env.EMAILERRORS!;
      const errorMessage = (error as MysqlError).message;
      sendEmail(emailAddress, 'System Error', `An error occurred executing a MySQL query: ${errorMessage}`);
      console.error('An error occurred executing the query:', error);
      return { errorSys: true, message: 'Intenal Server Error' };
    }
  }

  executeQuery(query: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, params, (error: MysqlError | null, result: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.end((err?: MysqlError) => {
        if (err) {
          console.error(`Error closing MySQL connection: ${err.message}`);
          reject(err);
        } else {
          console.log('MySQL connection closed successfully!');
          resolve();
        }
      });
    });
  }

  status(): string {
    return this.connection.state;
  }

  myEscape(str: string): string {
    return this.connection.escape(str);
  }

  async testConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.connection.ping((err?: MysqlError) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
}

export default Database;

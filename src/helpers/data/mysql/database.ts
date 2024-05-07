import mysql, { Connection, MysqlError } from 'mysql';
import dotenv from 'dotenv';
import sendEmail from '../../../helpers/lib/email';

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

  async executeQuery(query: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, params, (err: MysqlError | null, result: any) => {
        if (err) {
          const emailAddress = process.env.EMAILERRORS ?? 'default@example.com';
          const errorMessage = err ?? 'No error message provided';
          sendEmail(emailAddress, 'system Errors', `The following errors have occurred: ${errorMessage}`);
          resolve({ error: true, message: `Error executing MySQL query: ${err.message}` });
        } else {
          resolve({ error: false, result: result });
        }
      });
    });
  }

  async loginUser(name: string): Promise<string | false> {
    try {
      const data = await this.executeQuery('SELECT * FROM users WHERE first_name = ?', [name]);
      if (data.length > 0) {
        return data[0].password;
      } else {
        return false;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Error executing MySQL query: ${error.message}`);
      } else {
        throw new Error(`An unknown error occurred: ${String(error)}`);
      }
    }
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
}

export default Database;

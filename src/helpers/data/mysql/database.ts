import mysql from 'mysql';
import dotenv from 'dotenv';

class Database {
  private connection: mysql.Connection;

  constructor(db_name: string) {
    dotenv.config();
    this.connection = mysql.createConnection({
      host: process.env.MYHOST,
      user: process.env.MYUSER,
      password: process.env.MYPASSWORD,
      database: process.env[db_name],
      port: parseInt(process.env.MYPORT!),
    });
  }

  open(): void {
    this.connection.connect((err) => {
      if (err) {
        throw new Error(`Error connecting to MySQL: ${err.message}`);
      }
      console.log('Connected to MySQL successfully!');
    });
  }

  async executeQuery(query: string, params: object = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, params, (err, result) => {
        if (err) {
          reject(new Error(`Error executing MySQL query: ${err.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  async loginUser(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(
        'SELECT * FROM users WHERE first_name = ' + this.connection.escape(name),
        (err, data) => {
          if (err) {
            reject(new Error(`Error executing MySQL query: ${err.message}`));
          } else {
            if (data.length > 0) {
              resolve(data[0].password);
            } else {
              resolve(false);
            }
          }
        }
      );
    });
  }

  close(): void {
    this.connection.end((err) => {
      if (err) {
        console.error(`Error closing MySQL connection: ${err.message}`);
      }
      console.log('MySQL connection closed successfully!');
    });
  }

  status(): string {
    return this.connection.state;
  }
}

export default Database;

import mysql from 'mysql';
import dotenv from 'dotenv';

class Database {
  private connection: mysql.Connection;

  constructor() {
    dotenv.config();
    this.connection = mysql.createConnection({
      host: process.env.MYHOST,
      user: process.env.MYUSER,
      password: process.env.MYPASSWORD,
      database: process.env.MYDATABASE,
      port: parseInt(process.env.MYPORT!),
    });
    this.open();
  }

  open(): void {
    this.connection.connect((err) => {
      if (err) {
        throw new Error(`Error connecting to MySQL: ${err.message}`);
      }
      console.log('Connected to MySQL successfully!');
    });
  }

  async executeQuery(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection.query(query, (err, result) => {
        if (err) {
          reject(new Error(`Error executing MySQL query: ${err.message}`));
        } else {
          resolve(result);
        }
      });
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
}

export default Database;

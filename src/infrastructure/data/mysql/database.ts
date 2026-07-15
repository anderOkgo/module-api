import mysql, { Pool, PoolConnection, MysqlError } from 'mysql';
import dotenv from 'dotenv';
import sendEmail from '../../../infrastructure/services/email';

export type QueryExecutor = (query: string, params?: any) => Promise<any>;

class Database {
  private pool: Pool;

  constructor(dbName: string) {
    dotenv.config();
    this.pool = mysql.createPool({
      host: process.env.MYHOST!,
      user: process.env.MYUSER!,
      password: process.env.MYPASSWORD!,
      database: process.env[dbName]!,
      port: parseInt(process.env.MYPORT!, 10),
      charset: 'utf8mb4',
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    });
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err: MysqlError | null, connection: PoolConnection) => {
        if (err) {
          reject(new Error(`Error connecting to MySQL: ${err.message}`));
        } else {
          console.log('Connected to MySQL successfully!');
          connection.release();
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

  /**
   * Runs `work` on a single pooled connection wrapped in BEGIN/COMMIT, rolling
   * back and rethrowing on any failure. Unlike executeSafeQuery, the query
   * executor passed to `work` throws on error instead of swallowing it, so a
   * failed statement naturally triggers the rollback below.
   */
  async runInTransaction<T>(work: (query: QueryExecutor) => Promise<T>): Promise<T> {
    const connection = await new Promise<PoolConnection>((resolve, reject) => {
      this.pool.getConnection((err: MysqlError | null, conn: PoolConnection) => {
        if (err) {
          reject(err);
        } else {
          resolve(conn);
        }
      });
    });

    const query: QueryExecutor = (sql: string, params: any = []) =>
      new Promise((resolve, reject) => {
        connection.query(sql, params, (err: MysqlError | null, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

    try {
      await new Promise<void>((resolve, reject) => {
        connection.beginTransaction((err?: MysqlError) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      const result = await work(query);

      await new Promise<void>((resolve, reject) => {
        connection.commit((err?: MysqlError) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      return result;
    } catch (error) {
      await new Promise<void>((resolve) => connection.rollback(() => resolve()));
      throw error;
    } finally {
      connection.release();
    }
  }

  executeQuery(query: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pool.query(query, params, (error: MysqlError | null, result: any) => {
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
      this.pool.end((err?: MysqlError) => {
        if (err) {
          console.error(`Error closing MySQL pool: ${err.message}`);
          reject(err);
        } else {
          console.log('MySQL pool closed successfully!');
          resolve();
        }
      });
    });
  }

  myEscape(str: string): string {
    return this.pool.escape(str);
  }

  // Acquires a pooled connection and pings it, releasing it back to the pool
  // afterwards. Used as a lightweight liveness/keep-alive check.
  async testConnection(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err: MysqlError | null, connection: PoolConnection) => {
        if (err) {
          reject(err);
          return;
        }
        connection.ping((pingErr?: MysqlError) => {
          connection.release();
          if (pingErr) {
            reject(pingErr);
          } else {
            resolve(true);
          }
        });
      });
    });
  }
}

export default Database;

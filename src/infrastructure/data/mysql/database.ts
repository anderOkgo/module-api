import mysql, { Connection, MysqlError } from 'mysql';
import dotenv from 'dotenv';
import sendEmail from '../../../infrastructure/services/email';

class Database {
  private connection: Connection;
  private dbName: string;
  private config: any;
  private reconnecting: boolean = false;

  constructor(dbName: string) {
    dotenv.config();
    this.dbName = dbName;
    this.config = {
      host: process.env.MYHOST!,
      user: process.env.MYUSER!,
      password: process.env.MYPASSWORD!,
      database: process.env[dbName]!,
      port: parseInt(process.env.MYPORT!, 10),
    };
    this.connection = mysql.createConnection(this.config);
    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    // Manejo de errores de conexión
    this.connection.on('error', (err: MysqlError) => {
      console.error('MySQL connection error:', err);

      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('⚠️  Connection lost. Attempting to reconnect...');
        this.handleDisconnect();
      } else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.error('❌ Fatal error detected. Reconnecting...');
        this.handleDisconnect();
      } else if (err.fatal) {
        console.error('❌ Fatal MySQL error. Reconnecting...');
        this.handleDisconnect();
      } else {
        console.error('Non-fatal MySQL error:', err.message);
      }
    });

    // Manejo de cierre de conexión
    this.connection.on('end', () => {
      console.log('MySQL connection ended');
    });
  }

  private handleDisconnect(): void {
    if (this.reconnecting) {
      return; // Ya hay una reconexión en progreso
    }

    this.reconnecting = true;

    // Esperar 2 segundos antes de intentar reconectar
    setTimeout(() => {
      console.log('🔄 Reconnecting to MySQL...');
      this.connection = mysql.createConnection(this.config);
      this.setupConnectionHandlers();

      this.connection.connect((err?: MysqlError) => {
        this.reconnecting = false;
        if (err) {
          console.error('❌ Error reconnecting to MySQL:', err.message);
          // Intentar reconectar nuevamente
          this.handleDisconnect();
        } else {
          console.log('✅ Reconnected to MySQL successfully!');
        }
      });
    }, 2000);
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.connection.connect((err?: MysqlError) => {
        if (err) {
          reject(new Error(`Error connecting to MySQL: ${err.message}`));
        } else {
          console.log('✅ Connected to MySQL successfully!');
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

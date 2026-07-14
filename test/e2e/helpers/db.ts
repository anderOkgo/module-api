import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Raw, ad-hoc connection for E2E test setup/teardown (seeding and cleaning up
 * fixtures) — deliberately separate from the app's own Database class/pool,
 * since these queries are test scaffolding, not application behavior under test.
 *
 * `dbNameEnvVar` is one of MYDATABASEANIME / MYDATABASEFINAN / MYDATABASEAUTH,
 * matching the env var names the app itself uses (see src/infrastructure/data/mysql/database.ts).
 */
export function rawQuery<T = any>(dbNameEnvVar: string, sql: string, params: any[] = []): Promise<T> {
  return new Promise((resolve, reject) => {
    const connection = mysql.createConnection({
      host: process.env.MYHOST,
      user: process.env.MYUSER,
      password: process.env.MYPASSWORD,
      database: process.env[dbNameEnvVar],
      port: parseInt(process.env.MYPORT!, 10),
      charset: 'utf8mb4',
    });

    connection.query(sql, params, (error, results) => {
      connection.end();
      if (error) reject(error);
      else resolve(results as T);
    });
  });
}

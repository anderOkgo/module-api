import mysql from 'mysql';
import dotenv from 'dotenv';

// setting env vars
dotenv.config();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'animecream',
  port: parseInt(process.env.MYPORT!) || 3307,
});

export default connection;

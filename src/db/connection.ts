import mysql from 'mysql';
import dotenv from 'dotenv';

// setting env vars
dotenv.config();

const connection = mysql.createConnection({
  host: process.env.MYHOST,
  user: process.env.MYUSER,
  password: process.env.MYPASSWORD,
  database: process.env.MYDATABASE,
  port: parseInt(process.env.MYPORT!),
});

export default connection;

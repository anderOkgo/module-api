import dotenv from 'dotenv';
import Server from './models/server';

// setting env vars
dotenv.config();

const server = new Server();

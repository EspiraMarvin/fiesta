import app from './app';
import path from 'path';
import dotenv from 'dotenv';
import { fetchAndStoreUsers } from './utils/fetchInitialData';

// oad env file based on NODE_ENV
dotenv.config({
  path: path.resolve(
    __dirname,
    `../.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`
  ),
});

const PORT = process.env.PORT || 4000;

async function start() {
  await fetchAndStoreUsers();
  app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
  });
}

start();

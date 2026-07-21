import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { connectDB } from './config/db';
import { initSocket } from './lib/socket';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

const start = async () => {
  try {
    await connectDB();

    const server = createServer(app);
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`RescueLink API & WebSocket server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

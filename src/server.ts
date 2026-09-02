import app from './app.js';
import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    app.listen(env.PORT, () => {
      console.log(`🚀 Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

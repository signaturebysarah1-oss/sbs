import { env } from './config/env.js';
import { connectDatabase } from './database/pool.js';
import app from './app.js';

async function start(): Promise<void> {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

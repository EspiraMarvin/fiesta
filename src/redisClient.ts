import { createClient } from 'redis';
import logger from './utils/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => {
  console.error(`Redis connection failed:`, err);
  logger.error(`Redis connection failed:`, err);
});

(async () => {
  try {
    await redisClient.connect();
    logger.info(`Connected to Redis at ${redisUrl}`);
  } catch (err) {
    logger.error(`Redis connection failed:`, err);
  }
})();

export default redisClient;

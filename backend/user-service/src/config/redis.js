const redis = require('redis');
const { promisify } = require('util');
const logger = require('../utils/logger');

let redisClient;
let getAsync;
let setAsync;
let delAsync;

/**
 * Initialize Redis client
 */
async function initRedis() {
  try {
    // Create Redis client
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    // Handle Redis connection events
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err}`);
    });

    // Connect to Redis
    await redisClient.connect();

    // Promisify Redis commands
    getAsync = redisClient.get.bind(redisClient);
    setAsync = redisClient.set.bind(redisClient);
    delAsync = redisClient.del.bind(redisClient);

    return redisClient;
  } catch (error) {
    logger.error(`Redis initialization error: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initRedis,
  getRedisClient: () => redisClient,
  getAsync,
  setAsync,
  delAsync
}; 
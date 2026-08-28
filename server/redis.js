import IORedis from 'ioredis';

/**
 * Build ioredis connection options from REDIS_URL.
 *
 * Upstash requires TLS (rediss://). BullMQ additionally requires
 * `maxRetriesPerRequest: null` on any connection used by a Queue/Worker,
 * otherwise it throws on startup. We apply both here so the same factory can
 * back the plain availability cache AND the BullMQ producer/consumer.
 */
export function redisConnectionOptions(url = process.env.REDIS_URL) {
  if (!url) {
    throw new Error('REDIS_URL is not set — copy .env.example to .env and fill it in.');
  }
  const isTls = url.startsWith('rediss://');
  return {
    // BullMQ requirement — must be null, not a number.
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(isTls ? { tls: {} } : {}),
  };
}

/**
 * A shared client for the availability cache (GET/SET of seat counts).
 * BullMQ Queues/Workers create their own connections from the same options.
 */
export function createRedisClient(url = process.env.REDIS_URL) {
  const client = new IORedis(url, redisConnectionOptions(url));
  client.on('error', (err) => console.error('[redis] error:', err.message));
  client.on('connect', () => console.log('[redis] connected'));
  return client;
}

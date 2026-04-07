const NodeCache = require('node-cache');

// ─── IN-MEMORY FALLBACK ───────────────────────────────────────────────────────
const nodeCache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '300'),
  checkperiod: 600,
  useClones: false,
});

// ─── REDIS CLIENT (optional - graceful fallback) ──────────────────────────────
let redisClient = null;
let useRedis = false;

try {
  const Redis = require('ioredis');
  
  // If a full URL is provided (like Render's internal URL), use it directly.
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  } else {
    // Otherwise fallback to individual parts
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      lazyConnect: true,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
  }

  redisClient.on('connect', () => {
    useRedis = true;
    console.log('✅ Redis connected — using Redis cache');
  });

  redisClient.on('error', () => {
    if (useRedis) console.log('⚠️  Redis disconnected — falling back to in-memory cache');
    useRedis = false;
  });

  // Try to connect
  redisClient.connect().catch(() => {
    console.log('ℹ️  Redis not available — using in-memory cache (node-cache)');
    useRedis = false;
  });
} catch (e) {
  console.log('ℹ️  ioredis not loaded — using in-memory cache');
}

// ─── UNIFIED CACHE INTERFACE ──────────────────────────────────────────────────
const cacheGet = async (key) => {
  try {
    if (useRedis && redisClient) {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : undefined;
    }
  } catch { useRedis = false; }
  return nodeCache.get(key);
};

const cacheSet = async (key, value, ttl) => {
  try {
    if (useRedis && redisClient) {
      const seconds = ttl || parseInt(process.env.CACHE_TTL || '300');
      await redisClient.setex(key, seconds, JSON.stringify(value));
      return;
    }
  } catch { useRedis = false; }
  if (ttl) nodeCache.set(key, value, ttl);
  else nodeCache.set(key, value);
};

const cacheDel = async (key) => {
  try {
    if (useRedis && redisClient) { await redisClient.del(key); return; }
  } catch { useRedis = false; }
  nodeCache.del(key);
};

const cacheFlushAll = async () => {
  try {
    if (useRedis && redisClient) { await redisClient.flushdb(); return; }
  } catch { useRedis = false; }
  nodeCache.flushAll();
};

const invalidateProductCache = async (productId) => {
  try {
    if (useRedis && redisClient) {
      // Scan BOTH 'product:*' (singular — detail cache by slug/sku/uuid)
      // AND  'products:*' (plural  — list/search/featured caches)
      const [detailKeys, listKeys] = await Promise.all([
        redisClient.keys('product:*'),   // product:nike-air-max, product:<uuid>, etc.
        redisClient.keys('products:*'),  // products:featured, products:{query}, etc.
      ]);
      const allKeys = [...detailKeys, ...listKeys, 'categories:all', 'admin:stats'];
      if (allKeys.length) await redisClient.del(...allKeys);
      return;
    }
  } catch { useRedis = false; }
  // node-cache fallback — match both singular and plural product keys
  const keys = nodeCache.keys();
  keys.forEach((k) => {
    if (
      k.startsWith('products:') ||
      k.startsWith('product:') ||
      k === 'categories:all' ||
      k === 'admin:stats'
    ) {
      nodeCache.del(k);
    }
  });
};

// ─── CACHE KEY BUILDERS ───────────────────────────────────────────────────────
const cacheKeys = {
  PRODUCTS_LIST: (params) => `products:${JSON.stringify(params)}`,
  PRODUCT_DETAIL: (id) => `product:${id}`,
  CATEGORIES: 'categories:all',
  FEATURED: 'products:featured',
  STATS: 'admin:stats',
};

module.exports = {
  redisClient,
  cacheKeys,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheFlushAll,
  invalidateProductCache,
  isRedisActive: () => useRedis,
};

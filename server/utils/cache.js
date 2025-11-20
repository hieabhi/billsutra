/**
 * Caching Layer
 * Industry Standard: Cache frequently accessed, rarely changing data
 * Expected performance: 40-60% reduction in database queries
 */

import NodeCache from 'node-cache';

// Create cache instances with different TTLs
const caches = {
  // Room types and settings (rarely change)
  settings: new NodeCache({ 
    stdTTL: 3600, // 1 hour
    checkperiod: 600, // Check for expired keys every 10 min
    useClones: false, // Better performance
  }),
  
  // Room availability (changes frequently)
  rooms: new NodeCache({ 
    stdTTL: 30, // 30 seconds
    checkperiod: 60,
    useClones: false,
  }),
  
  // User data (moderate change frequency)
  users: new NodeCache({ 
    stdTTL: 300, // 5 minutes
    checkperiod: 120,
    useClones: false,
  }),
  
  // Rate plans (changes occasionally)
  ratePlans: new NodeCache({ 
    stdTTL: 1800, // 30 minutes
    checkperiod: 300,
    useClones: false,
  }),
};

/**
 * Get from cache or execute function and cache result
 */
export async function cacheOrFetch(cacheName, key, fetchFunction, ttl = null) {
  const cache = caches[cacheName];
  
  if (!cache) {
    console.warn(`⚠️ Cache '${cacheName}' not found, executing function directly`);
    return await fetchFunction();
  }
  
  // Try to get from cache
  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`✅ Cache HIT: ${cacheName}:${key}`);
    return cached;
  }
  
  // Not in cache, fetch and store
  console.log(`❌ Cache MISS: ${cacheName}:${key}`);
  const result = await fetchFunction();
  
  if (result !== null && result !== undefined) {
    if (ttl) {
      cache.set(key, result, ttl);
    } else {
      cache.set(key, result);
    }
  }
  
  return result;
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(cacheName, key) {
  const cache = caches[cacheName];
  if (cache) {
    cache.del(key);
    console.log(`🗑️ Cache invalidated: ${cacheName}:${key}`);
  }
}

/**
 * Invalidate entire cache category
 */
export function invalidateCacheCategory(cacheName) {
  const cache = caches[cacheName];
  if (cache) {
    cache.flushAll();
    console.log(`🗑️ Cache category flushed: ${cacheName}`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {};
  
  Object.keys(caches).forEach(name => {
    const cache = caches[name];
    stats[name] = cache.getStats();
  });
  
  return stats;
}

/**
 * Middleware to cache GET requests
 */
export function cacheMiddleware(cacheName, getTTL = () => 60) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `${req.originalUrl || req.url}`;
    const cached = caches[cacheName]?.get(key);
    
    if (cached) {
      console.log(`✅ Response cache HIT: ${key}`);
      return res.json(cached);
    }
    
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache response
    res.json = function(data) {
      const ttl = typeof getTTL === 'function' ? getTTL(req) : getTTL;
      caches[cacheName]?.set(key, data, ttl);
      console.log(`💾 Response cached: ${key} (TTL: ${ttl}s)`);
      return originalJson(data);
    };
    
    next();
  };
}

export default caches;

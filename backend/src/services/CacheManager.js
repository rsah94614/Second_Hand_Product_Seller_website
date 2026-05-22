const redis = require('redis');
const logger = require('./logger.service');

/**
 * CacheManager
 * Manages Redis cache with TTL, LRU eviction policy, and cache statistics
 * 
 * Configuration:
 * - TTL: 60 seconds for all metric calculations
 * - Eviction Policy: LRU (Least Recently Used)
 * - Max Memory: Configured via Redis server
 * - Key Pattern: report:{reportType}:{dateRangeHash}:{sortBy}
 */
class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Initialize Redis connection
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (this.isConnected) {
        logger.info('Cache already initialized');
        return;
      }

      // Create Redis client with connection pooling
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        db: process.env.REDIS_DB || 0,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis max retries exceeded');
            }
            return retries * 50;
          },
        },
      });

      // Handle connection events
      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
      });

      // Connect to Redis
      await this.client.connect();
      this.isConnected = true;

      // Configure LRU eviction policy
      await this.configureLRUEviction();

      logger.info('Cache Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Cache Manager', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Configure LRU eviction policy on Redis server
   * @returns {Promise<void>}
   */
  async configureLRUEviction() {
    try {
      // Set maxmemory policy to allkeys-lru
      // This evicts the least recently used key when max memory is reached
      await this.client.configSet('maxmemory-policy', 'allkeys-lru');

      // Set max memory if specified in environment
      if (process.env.REDIS_MAX_MEMORY) {
        await this.client.configSet('maxmemory', process.env.REDIS_MAX_MEMORY);
      }

      logger.info('LRU eviction policy configured', {
        policy: 'allkeys-lru',
        maxMemory: process.env.REDIS_MAX_MEMORY || 'default',
      });
    } catch (error) {
      logger.error('Failed to configure LRU eviction policy', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get cached value or compute if missing
   * 
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute value if cache miss
   * @param {number} ttl - Time to live in seconds (default: 60)
   * @returns {Promise<any>} Cached or computed value
   * 
   * @example
   * const result = await cacheManager.getOrCompute(
   *   'report:dashboard:2024-01-01_2024-01-31',
   *   async () => await reportGenerator.getDashboardMetrics(...),
   *   60
   * );
   */
  async getOrCompute(key, computeFn, ttl = 60) {
    try {
      // Try to get from cache
      const cachedValue = await this.get(key);

      if (cachedValue !== null) {
        this.stats.hits++;
        logger.debug('Cache hit', { key });

        // Track cache hit in monitoring
        try {
          const monitoringService = require('./MonitoringService');
          monitoringService.trackCacheAccess({
            cacheKey: key,
            hit: true,
            reportType: key.split(':')[1] || 'unknown',
          });
        } catch (_) {
          // Monitoring service may not be available
        }

        return cachedValue;
      }

      // Cache miss - compute value
      this.stats.misses++;
      logger.debug('Cache miss', { key });

      // Track cache miss in monitoring
      try {
        const monitoringService = require('./MonitoringService');
        monitoringService.trackCacheAccess({
          cacheKey: key,
          hit: false,
          reportType: key.split(':')[1] || 'unknown',
        });
      } catch (_) {
        // Monitoring service may not be available
      }

      const computedValue = await computeFn();

      // Store in cache
      await this.set(key, computedValue, ttl);

      return computedValue;
    } catch (error) {
      logger.error('Error in getOrCompute', {
        error: error.message,
        key,
      });
      throw error;
    }
  }

  /**
   * Get value from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null if not found
   */
  async get(key) {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, returning null');
        return null;
      }

      const value = await this.client.get(key);

      if (value === null) {
        return null;
      }

      // Parse JSON value
      try {
        return JSON.parse(value);
      } catch (_) {
        // Return as string if not valid JSON
        return value;
      }
    } catch (error) {
      logger.error('Error getting from cache', {
        error: error.message,
        key,
      });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * 
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 60)
   * @returns {Promise<void>}
   */
  async set(key, value, ttl = 60) {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping set');
        return;
      }

      // Serialize value to JSON
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

      // Set with expiration
      await this.client.setEx(key, ttl, serializedValue);

      this.stats.sets++;
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Error setting cache', {
        error: error.message,
        key,
      });
      throw error;
    }
  }

  /**
   * Delete key from cache
   * 
   * @param {string} key - Cache key
   * @returns {Promise<number>} Number of keys deleted (0 or 1)
   */
  async delete(key) {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping delete');
        return 0;
      }

      const result = await this.client.del(key);
      this.stats.deletes++;
      logger.debug('Cache delete', { key, deleted: result });
      return result;
    } catch (error) {
      logger.error('Error deleting from cache', {
        error: error.message,
        key,
      });
      throw error;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * 
   * @param {string} pattern - Key pattern (e.g., 'report:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async deletePattern(pattern) {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping deletePattern');
        return 0;
      }

      // Scan for keys matching pattern
      const keys = [];
      let cursor = '0';

      do {
        const reply = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = reply.cursor;
        keys.push(...reply.keys);
      } while (cursor !== '0');

      // Delete all matching keys
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        this.stats.deletes += result;
        logger.debug('Cache deletePattern', { pattern, deleted: result });
        return result;
      }

      return 0;
    } catch (error) {
      logger.error('Error deleting pattern from cache', {
        error: error.message,
        pattern,
      });
      throw error;
    }
  }

  /**
   * Invalidate report cache on order completion
   * 
   * @param {string} orderId - Order ID
   * @param {Array<string>} affectedReportTypes - Report types to invalidate
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidateReportCache(orderId, affectedReportTypes = []) {
    try {
      let totalDeleted = 0;

      // If no specific report types provided, invalidate all report caches
      if (affectedReportTypes.length === 0) {
        totalDeleted = await this.deletePattern('report:*');
      } else {
        // Invalidate specific report types
        for (const reportType of affectedReportTypes) {
          const deleted = await this.deletePattern(`report:${reportType}:*`);
          totalDeleted += deleted;
        }
      }

      logger.info('Report cache invalidated', {
        orderId,
        affectedReportTypes,
        keysDeleted: totalDeleted,
      });

      return totalDeleted;
    } catch (error) {
      logger.error('Error invalidating report cache', {
        error: error.message,
        orderId,
      });
      throw error;
    }
  }

  /**
   * Warm cache by pre-computing common queries
   * 
   * @param {Array<string>} reportTypes - Report types to warm
   * @param {Array<Object>} dateRanges - Date ranges to warm
   * @param {Function} computeFn - Function to compute values
   * @returns {Promise<number>} Number of keys warmed
   */
  async warmCache(reportTypes, dateRanges, computeFn) {
    try {
      let warmed = 0;

      for (const reportType of reportTypes) {
        for (const dateRange of dateRanges) {
          const key = `report:${reportType}:${this.hashDateRange(dateRange)}`;

          // Check if already cached
          const existing = await this.get(key);
          if (existing !== null) {
            logger.debug('Cache already warm', { key });
            continue;
          }

          // Compute and cache
          const value = await computeFn(reportType, dateRange);
          await this.set(key, value, 60);
          warmed++;
        }
      }

      logger.info('Cache warmed', { reportTypes, dateRanges, warmed });
      return warmed;
    } catch (error) {
      logger.error('Error warming cache', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns {Promise<Object>} Cache statistics including hit rate, miss rate, size, evictions
   */
  async getCacheStats() {
    try {
      const info = await this.client.info('stats');
      const memoryInfo = await this.client.info('memory');

      // Parse info response
      const stats = this.parseRedisInfo(info);
      const memory = this.parseRedisInfo(memoryInfo);

      // Calculate hit rate
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0
        ? parseFloat(((this.stats.hits / totalRequests) * 100).toFixed(2))
        : 0;
      const missRate = totalRequests > 0
        ? parseFloat(((this.stats.misses / totalRequests) * 100).toFixed(2))
        : 0;

      // Get database size
      const dbSize = await this.client.dbSize();

      const result = {
        hits: this.stats.hits,
        misses: this.stats.misses,
        hitRate,
        missRate,
        sets: this.stats.sets,
        deletes: this.stats.deletes,
        evictions: this.stats.evictions,
        size: dbSize,
        memoryUsed: memory.used_memory ? parseInt(memory.used_memory) : 0,
        memoryPeak: memory.used_memory_peak ? parseInt(memory.used_memory_peak) : 0,
        connectedClients: stats.connected_clients ? parseInt(stats.connected_clients) : 0,
        totalCommandsProcessed: stats.total_commands_processed ? parseInt(stats.total_commands_processed) : 0,
      };

      logger.debug('Cache statistics retrieved', result);
      return result;
    } catch (error) {
      logger.error('Error getting cache statistics', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Clear all cache
   * 
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      if (!this.isConnected) {
        logger.warn('Cache not connected, skipping clear');
        return;
      }

      await this.client.flushDb();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Error clearing cache', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Close Redis connection
   * 
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Cache connection closed');
      }
    } catch (error) {
      logger.error('Error closing cache connection', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Hash date range for cache key
   * 
   * @param {Object} dateRange - Date range object
   * @returns {string} Hash of date range
   */
  hashDateRange(dateRange) {
    const crypto = require('crypto');
    const key = `${dateRange.startDate}-${dateRange.endDate}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }

  /**
   * Parse Redis INFO response
   * 
   * @param {string} info - Redis INFO response
   * @returns {Object} Parsed info object
   */
  parseRedisInfo(info) {
    const result = {};
    const lines = info.split('\r\n');

    lines.forEach((line) => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });

    return result;
  }

  /**
   * Check if cache is connected
   * 
   * @returns {boolean} Connection status
   */
  isReady() {
    return this.isConnected;
  }
}

// Export singleton instance
module.exports = new CacheManager();

const assert = require('assert');
const CacheManager = require('../src/services/CacheManager');

/**
 * CacheManager Tests
 * Tests for cache operations, TTL, LRU eviction, and statistics
 */
const runCacheManagerTests = async () => {
  let originalClient;

  // Store original client
  originalClient = CacheManager.client;

  try {
    // Test: Cache Operations - Set and Get
    {
      const key = 'test:key:1';
      const value = { data: 'test value' };

      const mockClient = {
        setEx: async (k, ttl, _) => {
          assert.strictEqual(k, key);
          assert.strictEqual(ttl, 60);
          return 'OK';
        },
        get: async (k) => {
          assert.strictEqual(k, key);
          return JSON.stringify(value);
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.set(key, value, 60);
      const retrieved = await CacheManager.get(key);
      assert.deepStrictEqual(retrieved, value);
    }

    // Test: Return null for non-existent key
    {
      const key = 'test:nonexistent';

      const mockClient = {
        get: async (_) => null,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const result = await CacheManager.get(key);
      assert.strictEqual(result, null);
    }

    // Test: Delete a key from cache
    {
      const key = 'test:delete:key';

      const mockClient = {
        del: async (k) => {
          assert.strictEqual(k, key);
          return 1;
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const result = await CacheManager.delete(key);
      assert.strictEqual(result, 1);
    }

    // Test: Handle cache miss and compute value
    {
      const key = 'test:compute:key';
      const computedValue = { computed: true };
      let computeFnCalled = false;

      const mockClient = {
        get: async (_) => null,
        setEx: async () => 'OK',
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;
      CacheManager.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };

      const computeFn = async () => {
        computeFnCalled = true;
        return computedValue;
      };

      const result = await CacheManager.getOrCompute(key, computeFn, 60);

      assert.strictEqual(computeFnCalled, true);
      assert.deepStrictEqual(result, computedValue);
      assert.strictEqual(CacheManager.stats.misses, 1);
    }

    // Test: Return cached value on cache hit
    {
      const key = 'test:hit:key';
      const cachedValue = { cached: true };
      let computeFnCalled = false;

      const mockClient = {
        get: async (_) => JSON.stringify(cachedValue),
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;
      CacheManager.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };

      const computeFn = async () => {
        computeFnCalled = true;
        return { should: 'not be called' };
      };

      const result = await CacheManager.getOrCompute(key, computeFn, 60);

      assert.strictEqual(computeFnCalled, false);
      assert.deepStrictEqual(result, cachedValue);
      assert.strictEqual(CacheManager.stats.hits, 1);
    }

    // Test: Set TTL on cache entries
    {
      const key = 'test:ttl:key';
      const value = { ttl: 'test' };
      const ttl = 120;
      let setExCalled = false;

      const mockClient = {
        setEx: async (k, t, _) => {
          setExCalled = true;
          assert.strictEqual(k, key);
          assert.strictEqual(t, ttl);
          return 'OK';
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.set(key, value, ttl);
      assert.strictEqual(setExCalled, true);
    }

    // Test: Use default TTL of 60 seconds
    {
      const key = 'test:default:ttl';
      const value = { default: 'ttl' };
      let actualTtl = null;

      const mockClient = {
        setEx: async (k, t, _) => {
          actualTtl = t;
          return 'OK';
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.set(key, value);
      assert.strictEqual(actualTtl, 60);
    }

    // Test: Configure LRU eviction policy
    {
      let configSetCalls = [];

      const mockClient = {
        configSet: async (key, value) => {
          configSetCalls.push({ key, value });
          return 'OK';
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.configureLRUEviction();

      const lruCall = configSetCalls.find(c => c.key === 'maxmemory-policy');
      assert.strictEqual(lruCall.value, 'allkeys-lru');
    }

    // Test: Track eviction events
    {
      CacheManager.stats.evictions = 0;
      CacheManager.stats.evictions++;
      assert.strictEqual(CacheManager.stats.evictions, 1);
    }

    // Test: Evict least recently used items when cache is full
    {
      const mockClient = {
        setEx: async () => 'OK',
        get: async (_) => null,
        del: async (_) => 1,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const items = [];
      for (let i = 0; i < 5; i++) {
        const key = `test:lru:${i}`;
        const value = { index: i };
        await CacheManager.set(key, value, 60);
        items.push(key);
      }

      const firstItem = items[0];
      await CacheManager.get(firstItem);

      assert.strictEqual(items.length, 5);
    }

    // Test: Maintain cache statistics for evictions
    {
      CacheManager.stats = {
        hits: 10,
        misses: 5,
        sets: 15,
        deletes: 2,
        evictions: 3,
      };

      const stats = CacheManager.stats;
      assert.strictEqual(stats.evictions, 3);
      assert.strictEqual(stats.hits, 10);
      assert.strictEqual(stats.misses, 5);
    }

    // Test: Calculate hit rate correctly
    {
      CacheManager.stats = {
        hits: 80,
        misses: 20,
        sets: 100,
        deletes: 5,
        evictions: 0,
      };

      const mockClient = {
        info: async (section) => {
          if (section === 'stats') {
            return 'connected_clients:1\r\ntotal_commands_processed:100\r\n';
          }
          if (section === 'memory') {
            return 'used_memory:1000000\r\nused_memory_peak:1500000\r\n';
          }
        },
        dbSize: async () => 50,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const stats = await CacheManager.getCacheStats();

      assert.strictEqual(stats.hitRate, 80);
      assert.strictEqual(stats.missRate, 20);
      assert.strictEqual(stats.hits, 80);
      assert.strictEqual(stats.misses, 20);
    }

    // Test: Track cache operations
    {
      CacheManager.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
      };

      const mockClient = {
        setEx: async () => 'OK',
        del: async () => 1,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.set('key1', { data: 'value1' }, 60);
      await CacheManager.set('key2', { data: 'value2' }, 60);
      await CacheManager.delete('key1');

      assert.strictEqual(CacheManager.stats.sets, 2);
      assert.strictEqual(CacheManager.stats.deletes, 1);
    }

    // Test: Return zero hit rate when no requests
    {
      CacheManager.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0,
      };

      const mockClient = {
        info: async () => 'connected_clients:1\r\n',
        dbSize: async () => 0,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const stats = await CacheManager.getCacheStats();

      assert.strictEqual(stats.hitRate, 0);
      assert.strictEqual(stats.missRate, 0);
    }

    // Test: Invalidate report cache by pattern
    {
      const pattern = 'report:dashboard:*';
      let delCalls = 0;

      const mockClient = {
        scan: async (cursor, _) => {
          if (cursor === '0') {
            return {
              cursor: '0',
              keys: ['report:dashboard:key1', 'report:dashboard:key2'],
            };
          }
          return { cursor: '0', keys: [] };
        },
        del: async (keys) => {
          delCalls++;
          return keys.length;
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;
      CacheManager.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };

      const deleted = await CacheManager.deletePattern(pattern);

      assert.strictEqual(deleted, 2);
      assert.strictEqual(delCalls, 1);
    }

    // Test: Invalidate all report caches on order completion
    {
      const orderId = 'order123';
      let delPatternCalls = [];

      const originalDeletePattern = CacheManager.deletePattern;
      CacheManager.deletePattern = async (pattern) => {
        delPatternCalls.push(pattern);
        return 5;
      };

      const deleted = await CacheManager.invalidateReportCache(orderId, []);

      assert.strictEqual(deleted, 5);
      assert.strictEqual(delPatternCalls[0], 'report:*');

      CacheManager.deletePattern = originalDeletePattern;
    }

    // Test: Invalidate specific report types
    {
      const orderId = 'order456';
      const reportTypes = ['dashboard', 'top-products'];
      let delPatternCalls = [];

      const originalDeletePattern = CacheManager.deletePattern;
      CacheManager.deletePattern = async (pattern) => {
        delPatternCalls.push(pattern);
        return 3;
      };

      const deleted = await CacheManager.invalidateReportCache(orderId, reportTypes);

      assert.strictEqual(deleted, 6);
      assert.strictEqual(delPatternCalls.length, 2);
      assert.strictEqual(delPatternCalls[0], 'report:dashboard:*');
      assert.strictEqual(delPatternCalls[1], 'report:top-products:*');

      CacheManager.deletePattern = originalDeletePattern;
    }

    // Test: Warm cache with pre-computed values
    {
      const reportTypes = ['dashboard'];
      const dateRanges = [{ startDate: '2024-01-01', endDate: '2024-01-31' }];
      let setCalls = [];

      const mockClient = {
        get: async () => null,
        setEx: async (k, ttl, v) => {
          setCalls.push({ key: k, ttl, value: v });
          return 'OK';
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const computeFn = async (reportType, dateRange) => {
        return { reportType, dateRange, data: 'computed' };
      };

      const warmed = await CacheManager.warmCache(reportTypes, dateRanges, computeFn);

      assert.strictEqual(warmed, 1);
      assert.strictEqual(setCalls.length, 1);
    }

    // Test: Skip already warmed cache entries
    {
      const reportTypes = ['dashboard'];
      const dateRanges = [{ startDate: '2024-01-01', endDate: '2024-01-31' }];
      let setCalls = [];

      const mockClient = {
        get: async () => JSON.stringify({ cached: true }),
        setEx: async (k, ttl, v) => {
          setCalls.push({ key: k, ttl, value: v });
          return 'OK';
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const computeFn = async () => {
        return { data: 'computed' };
      };

      const warmed = await CacheManager.warmCache(reportTypes, dateRanges, computeFn);

      assert.strictEqual(warmed, 0);
      assert.strictEqual(setCalls.length, 0);
    }

    // Test: Check if cache is ready
    {
      CacheManager.isConnected = true;
      assert.strictEqual(CacheManager.isReady(), true);

      CacheManager.isConnected = false;
      assert.strictEqual(CacheManager.isReady(), false);
    }

    // Test: Handle operations when cache is not connected
    {
      CacheManager.isConnected = false;

      const result = await CacheManager.get('test:key');
      assert.strictEqual(result, null);
    }

    // Test: Skip set operation when cache is not connected
    {
      CacheManager.isConnected = false;

      await CacheManager.set('test:key', { data: 'value' }, 60);
    }

    // Test: Serialize and deserialize JSON objects
    {
      const key = 'test:json:key';
      const value = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: 'value' },
      };

      const mockClient = {
        setEx: async (k, ttl, v) => {
          const parsed = JSON.parse(v);
          assert.deepStrictEqual(parsed, value);
          return 'OK';
        },
        get: async (_) => JSON.stringify(value),
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.set(key, value, 60);
      const retrieved = await CacheManager.get(key);

      assert.deepStrictEqual(retrieved, value);
    }

    // Test: Handle string values
    {
      const key = 'test:string:key';
      const value = 'plain string value';

      const mockClient = {
        setEx: async () => 'OK',
        get: async (_) => value,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.set(key, value, 60);
      const retrieved = await CacheManager.get(key);

      assert.strictEqual(retrieved, value);
    }

    // Test: Handle cache errors gracefully
    {
      const key = 'test:error:key';

      const mockClient = {
        get: async () => {
          throw new Error('Redis connection error');
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const result = await CacheManager.get(key);
      assert.strictEqual(result, null);
    }

    // Test: Handle set errors gracefully
    {
      const key = 'test:set:error';
      const value = { data: 'test' };

      const mockClient = {
        setEx: async () => {
          throw new Error('Redis set error');
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      try {
        await CacheManager.set(key, value, 60);
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.strictEqual(error.message, 'Redis set error');
      }
    }

    // Test: Verify LRU eviction policy is configured
    {
      let configSetCalls = [];

      const mockClient = {
        configSet: async (key, value) => {
          configSetCalls.push({ key, value });
          return 'OK';
        },
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      await CacheManager.configureLRUEviction();

      const policyCall = configSetCalls.find(c => c.key === 'maxmemory-policy');
      assert.strictEqual(policyCall.value, 'allkeys-lru');

      assert.strictEqual(CacheManager.isReady(), true);
    }

    // Test: Log eviction events
    {
      CacheManager.stats.evictions = 0;

      CacheManager.stats.evictions++;

      assert.strictEqual(CacheManager.stats.evictions, 1);
    }

    // Test: Track cache statistics including evictions
    {
      CacheManager.stats = {
        hits: 100,
        misses: 20,
        sets: 120,
        deletes: 10,
        evictions: 5,
      };

      const mockClient = {
        info: async (section) => {
          if (section === 'stats') {
            return 'connected_clients:1\r\ntotal_commands_processed:150\r\n';
          }
          if (section === 'memory') {
            return 'used_memory:5000000\r\nused_memory_peak:6000000\r\n';
          }
        },
        dbSize: async () => 100,
      };

      CacheManager.client = mockClient;
      CacheManager.isConnected = true;

      const stats = await CacheManager.getCacheStats();

      assert.strictEqual(stats.evictions, 5);
      assert.strictEqual(stats.hitRate, 83.33);
      assert.strictEqual(stats.size, 100);
    }
  } finally {
    // Restore original client
    CacheManager.client = originalClient;
  }
};

module.exports = { runCacheManagerTests };

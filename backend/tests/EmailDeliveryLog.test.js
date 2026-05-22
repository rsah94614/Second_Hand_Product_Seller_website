/**
 * EmailDeliveryLog Collection Tests
 * 
 * Tests for the EmailDeliveryLog collection to verify:
 * - Collection exists and is accessible
 * - All required indexes are present
 * - Data can be stored and retrieved correctly
 * - Indexes support efficient querying
 * 
 * **Validates: Requirements 9, 17, 19 (Email delivery, email specifications, monitoring)**
 */

const mongoose = require('mongoose');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');

describe('EmailDeliveryLog Collection', () => {
  let testAdminId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusmitra-test');
    }
    
    // Create a test admin ID
    testAdminId = new mongoose.Types.ObjectId();
  });

  afterAll(async () => {
    // Clean up test data
    await EmailDeliveryLog.deleteMany({});
    
    // Disconnect from database
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  describe('Collection Existence', () => {
    test('EmailDeliveryLog collection should exist', async () => {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      expect(collectionNames).toContain('emaildeliverylogs');
    });

    test('EmailDeliveryLog model should be defined', () => {
      expect(EmailDeliveryLog).toBeDefined();
      expect(EmailDeliveryLog.collection).toBeDefined();
    });
  });

  describe('Index Verification', () => {
    test('jobId index should exist', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      expect(Object.keys(indexes)).toContain('jobId_1');
    });

    test('adminId index should exist', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      expect(Object.keys(indexes)).toContain('adminId_1');
    });

    test('finalStatus index should exist', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      expect(Object.keys(indexes)).toContain('finalStatus_1');
    });

    test('compound index (jobId, adminId, finalStatus) should exist', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      expect(Object.keys(indexes)).toContain('jobId_1_adminId_1_finalStatus_1');
    });

    test('messageId index should exist', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      expect(Object.keys(indexes)).toContain('messageId_1');
    });

    test('all required indexes should be present', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      const indexNames = Object.keys(indexes);
      
      const requiredIndexes = [
        'jobId_1',
        'adminId_1',
        'finalStatus_1',
        'jobId_1_adminId_1_finalStatus_1',
        'adminId_1_createdAt_-1',
        'finalStatus_1_createdAt_-1',
        'messageId_1'
      ];
      
      requiredIndexes.forEach(idx => {
        expect(indexNames).toContain(idx);
      });
    });
  });

  describe('Data Storage and Retrieval', () => {
    test('should create a delivery log entry', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-123',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        attempts: [
          {
            attemptNumber: 1,
            timestamp: new Date(),
            status: 'sent',
            error: ''
          }
        ],
        finalStatus: 'delivered',
        messageId: 'msg-123'
      });

      const saved = await deliveryLog.save();

      expect(saved._id).toBeDefined();
      expect(saved.jobId).toBe('job-123');
      expect(saved.adminId).toEqual(testAdminId);
      expect(saved.email).toBe('admin@example.com');
      expect(saved.finalStatus).toBe('delivered');
    });

    test('should retrieve delivery log by jobId', async () => {
      const found = await EmailDeliveryLog.findOne({ jobId: 'job-123' });
      expect(found).toBeDefined();
      expect(found.jobId).toBe('job-123');
      expect(found.adminId).toEqual(testAdminId);
    });

    test('should retrieve delivery log by adminId', async () => {
      const found = await EmailDeliveryLog.findOne({ adminId: testAdminId });
      expect(found).toBeDefined();
      expect(found.adminId).toEqual(testAdminId);
    });

    test('should retrieve delivery log by finalStatus', async () => {
      const found = await EmailDeliveryLog.findOne({ finalStatus: 'delivered' });
      expect(found).toBeDefined();
      expect(found.finalStatus).toBe('delivered');
    });

    test('should retrieve delivery log by messageId', async () => {
      const found = await EmailDeliveryLog.findOne({ messageId: 'msg-123' });
      expect(found).toBeDefined();
      expect(found.messageId).toBe('msg-123');
    });
  });

  describe('Query Performance with Indexes', () => {
    beforeEach(async () => {
      // Create multiple test entries
      const entries = [];
      for (let i = 0; i < 10; i++) {
        entries.push({
          jobId: `job-${i}`,
          adminId: testAdminId,
          email: `admin${i}@example.com`,
          reportType: 'weekly-summary',
          dateRange: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-07')
          },
          attempts: [
            {
              attemptNumber: 1,
              timestamp: new Date(),
              status: 'sent',
              error: ''
            }
          ],
          finalStatus: i % 2 === 0 ? 'delivered' : 'failed',
          messageId: `msg-${i}`
        });
      }
      await EmailDeliveryLog.insertMany(entries);
    });

    test('should efficiently query by adminId', async () => {
      const start = Date.now();
      const results = await EmailDeliveryLog.find({ adminId: testAdminId });
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be fast with index
    });

    test('should efficiently query by finalStatus', async () => {
      const start = Date.now();
      const results = await EmailDeliveryLog.find({ finalStatus: 'delivered' });
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be fast with index
    });

    test('should efficiently query by compound index (jobId, adminId, finalStatus)', async () => {
      const start = Date.now();
      await EmailDeliveryLog.find({
        jobId: 'job-0',
        adminId: testAdminId,
        finalStatus: 'delivered'
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be fast with compound index
    });

    test('should efficiently sort by createdAt with adminId', async () => {
      const start = Date.now();
      const results = await EmailDeliveryLog.find({ adminId: testAdminId })
        .sort({ createdAt: -1 })
        .limit(5);
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be fast with compound index
    });
  });

  describe('Schema Validation', () => {
    test('should require jobId', async () => {
      const deliveryLog = new EmailDeliveryLog({
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'delivered'
      });

      await expect(deliveryLog.save()).rejects.toThrow();
    });

    test('should require adminId', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-123',
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'delivered'
      });

      await expect(deliveryLog.save()).rejects.toThrow();
    });

    test('should require email', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-123',
        adminId: testAdminId,
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'delivered'
      });

      await expect(deliveryLog.save()).rejects.toThrow();
    });

    test('should validate finalStatus enum', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-123',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'invalid-status'
      });

      await expect(deliveryLog.save()).rejects.toThrow();
    });

    test('should set default finalStatus to pending', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-123',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        }
      });

      expect(deliveryLog.finalStatus).toBe('pending');
    });

    test('should normalize email to lowercase', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-123',
        adminId: testAdminId,
        email: 'ADMIN@EXAMPLE.COM',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'delivered'
      });

      const saved = await deliveryLog.save();
      expect(saved.email).toBe('admin@example.com');
    });
  });

  describe('Attempt Tracking', () => {
    test('should track multiple delivery attempts', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-retry-test',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        attempts: [
          {
            attemptNumber: 1,
            timestamp: new Date(),
            status: 'failed',
            error: 'Connection timeout'
          },
          {
            attemptNumber: 2,
            timestamp: new Date(),
            status: 'failed',
            error: 'Rate limited'
          },
          {
            attemptNumber: 3,
            timestamp: new Date(),
            status: 'sent',
            error: ''
          }
        ],
        finalStatus: 'delivered'
      });

      const saved = await deliveryLog.save();
      expect(saved.attempts.length).toBe(3);
      expect(saved.attempts[0].status).toBe('failed');
      expect(saved.attempts[2].status).toBe('sent');
    });

    test('should track retry scheduling', async () => {
      const nextRetry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
      
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-retry-schedule',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        attempts: [
          {
            attemptNumber: 1,
            timestamp: new Date(),
            status: 'failed',
            error: 'Connection timeout',
            nextRetry: nextRetry
          }
        ],
        finalStatus: 'pending'
      });

      const saved = await deliveryLog.save();
      expect(saved.attempts[0].nextRetry).toBeDefined();
      expect(saved.attempts[0].nextRetry.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-timestamp-test',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'delivered'
      });

      const saved = await deliveryLog.save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.createdAt instanceof Date).toBe(true);
    });

    test('should automatically set updatedAt', async () => {
      const deliveryLog = new EmailDeliveryLog({
        jobId: 'job-updated-test',
        adminId: testAdminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07')
        },
        finalStatus: 'delivered'
      });

      const saved = await deliveryLog.save();
      expect(saved.updatedAt).toBeDefined();
      expect(saved.updatedAt instanceof Date).toBe(true);
    });
  });
});

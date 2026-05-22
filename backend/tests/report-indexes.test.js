/**
 * Report Indexes Test Suite
 * 
 * Tests for MongoDB collections and indexes for the Sales & Revenue Reports feature.
 * Verifies:
 * - ReportSnapshot collection with TTL index for 2-year retention
 * - ReportAuditLog collection with indexes on adminId, action, timestamp
 * - EmailPreference collection with unique index on adminId
 * - EmailDeliveryLog collection with indexes on jobId, adminId, status
 * - Order model compound indexes for report queries
 * 
 * **Validates: Requirements 12, 14, 15, 19 (Data accuracy, retention, access control, monitoring)**
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Import models
const ReportSnapshot = require('../models/ReportSnapshot');
const ReportAuditLog = require('../models/ReportAuditLog');
const EmailPreference = require('../models/EmailPreference');
const EmailDeliveryLog = require('../models/EmailDeliveryLog');
const Order = require('../models/Order');

describe('Report Collections and Indexes', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('ReportSnapshot Collection', () => {
    it('should create a ReportSnapshot document with all required fields', async () => {
      const snapshot = await ReportSnapshot.create({
        reportType: 'dashboard',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        metrics: {
          totalRevenue: 50000,
          salesVolume: 100,
          avgOrderValue: 500,
          activeSellers: 25,
        },
        data: [],
        checksum: 'abc123def456',
        generatedBy: new mongoose.Types.ObjectId(),
        status: 'success',
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.reportType).toBe('dashboard');
      expect(snapshot.metrics.totalRevenue).toBe(50000);
      expect(snapshot.status).toBe('success');
    });

    it('should have TTL index on expiresAt field', async () => {
      const indexes = await ReportSnapshot.collection.getIndexes();
      const ttlIndex = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.expiresAt === 1;
      });

      expect(ttlIndex).toBeDefined();
      expect(ttlIndex[1].expireAfterSeconds).toBe(0);
    });

    it('should have compound index on reportType, dateRange.startDate, dateRange.endDate', async () => {
      const indexes = await ReportSnapshot.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.reportType === 1 &&
          spec.key['dateRange.startDate'] === 1 &&
          spec.key['dateRange.endDate'] === 1
        );
      });

      expect(compoundIndex).toBeDefined();
    });

    it('should have compound index on generatedBy, reportType, createdAt', async () => {
      const indexes = await ReportSnapshot.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.generatedBy === 1 &&
          spec.key.reportType === 1 &&
          spec.key.createdAt === -1
        );
      });

      expect(compoundIndex).toBeDefined();
    });
  });

  describe('ReportAuditLog Collection', () => {
    it('should create a ReportAuditLog document with all required fields', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const auditLog = await ReportAuditLog.create({
        adminId,
        action: 'view',
        reportType: 'dashboard',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        details: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          status: 'success',
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog.adminId).toEqual(adminId);
      expect(auditLog.action).toBe('view');
      expect(auditLog.details.status).toBe('success');
    });

    it('should have compound index on adminId, action, timestamp', async () => {
      const indexes = await ReportAuditLog.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.adminId === 1 &&
          spec.key.action === 1 &&
          spec.key.timestamp === -1
        );
      });

      expect(compoundIndex).toBeDefined();
    });

    it('should have index on adminId and timestamp', async () => {
      const indexes = await ReportAuditLog.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.adminId === 1 && spec.key.timestamp === -1;
      });

      expect(index).toBeDefined();
    });

    it('should have index on action and timestamp', async () => {
      const indexes = await ReportAuditLog.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.action === 1 && spec.key.timestamp === -1;
      });

      expect(index).toBeDefined();
    });
  });

  describe('EmailPreference Collection', () => {
    it('should create an EmailPreference document with all required fields', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const preference = await EmailPreference.create({
        adminId,
        email: 'admin@example.com',
        subscribed: true,
        frequency: 'weekly',
      });

      expect(preference).toBeDefined();
      expect(preference.adminId).toEqual(adminId);
      expect(preference.email).toBe('admin@example.com');
      expect(preference.subscribed).toBe(true);
    });

    it('should enforce unique index on adminId', async () => {
      const adminId = new mongoose.Types.ObjectId();
      
      await EmailPreference.create({
        adminId,
        email: 'admin1@example.com',
        subscribed: true,
        frequency: 'weekly',
      });

      // Attempting to create another preference with same adminId should fail
      await expect(
        EmailPreference.create({
          adminId,
          email: 'admin2@example.com',
          subscribed: true,
          frequency: 'weekly',
        })
      ).rejects.toThrow();
    });

    it('should have index on email', async () => {
      const indexes = await EmailPreference.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.email === 1;
      });

      expect(index).toBeDefined();
    });

    it('should have compound index on subscribed and frequency', async () => {
      const indexes = await EmailPreference.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.subscribed === 1 && spec.key.frequency === 1;
      });

      expect(compoundIndex).toBeDefined();
    });
  });

  describe('EmailDeliveryLog Collection', () => {
    it('should create an EmailDeliveryLog document with all required fields', async () => {
      const adminId = new mongoose.Types.ObjectId();
      const deliveryLog = await EmailDeliveryLog.create({
        jobId: 'job-123',
        adminId,
        email: 'admin@example.com',
        reportType: 'weekly-summary',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-07'),
        },
        attempts: [
          {
            attemptNumber: 1,
            status: 'sent',
          },
        ],
        finalStatus: 'delivered',
      });

      expect(deliveryLog).toBeDefined();
      expect(deliveryLog.jobId).toBe('job-123');
      expect(deliveryLog.adminId).toEqual(adminId);
      expect(deliveryLog.finalStatus).toBe('delivered');
    });

    it('should have compound index on jobId, adminId, finalStatus', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.jobId === 1 &&
          spec.key.adminId === 1 &&
          spec.key.finalStatus === 1
        );
      });

      expect(compoundIndex).toBeDefined();
    });

    it('should have index on adminId and createdAt', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.adminId === 1 && spec.key.createdAt === -1;
      });

      expect(index).toBeDefined();
    });

    it('should have index on finalStatus and createdAt', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.finalStatus === 1 && spec.key.createdAt === -1;
      });

      expect(index).toBeDefined();
    });

    it('should have index on messageId', async () => {
      const indexes = await EmailDeliveryLog.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.messageId === 1;
      });

      expect(index).toBeDefined();
    });
  });

  describe('Order Model Indexes', () => {
    it('should have index on status and createdAt', async () => {
      const indexes = await Order.collection.getIndexes();
      const index = Object.entries(indexes).find(([_, spec]) => {
        return spec.key.status === 1 && spec.key.createdAt === -1;
      });

      expect(index).toBeDefined();
    });

    it('should have compound index on seller, status, createdAt', async () => {
      const indexes = await Order.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.seller === 1 &&
          spec.key.status === 1 &&
          spec.key.createdAt === -1
        );
      });

      expect(compoundIndex).toBeDefined();
    });

    it('should have compound index on status, items.product, createdAt', async () => {
      const indexes = await Order.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.status === 1 &&
          spec.key['items.product'] === 1 &&
          spec.key.createdAt === -1
        );
      });

      expect(compoundIndex).toBeDefined();
    });

    it('should have compound index on status, total, createdAt', async () => {
      const indexes = await Order.collection.getIndexes();
      const compoundIndex = Object.entries(indexes).find(([_, spec]) => {
        return (
          spec.key.status === 1 &&
          spec.key.total === 1 &&
          spec.key.createdAt === -1
        );
      });

      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Index Performance', () => {
    it('should efficiently query ReportSnapshot by reportType and dateRange', async () => {
      const adminId = new mongoose.Types.ObjectId();
      
      // Create multiple snapshots
      for (let i = 0; i < 5; i++) {
        await ReportSnapshot.create({
          reportType: 'dashboard',
          dateRange: {
            startDate: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
            endDate: new Date(`2024-01-${String(i + 2).padStart(2, '0')}`),
          },
          metrics: { totalRevenue: 1000 * (i + 1) },
          data: [],
          checksum: `checksum-${i}`,
          generatedBy: adminId,
          status: 'success',
        });
      }

      // Query using the compound index
      const result = await ReportSnapshot.find({
        reportType: 'dashboard',
        'dateRange.startDate': { $gte: new Date('2024-01-01') },
        'dateRange.endDate': { $lte: new Date('2024-01-05') },
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should efficiently query ReportAuditLog by adminId and action', async () => {
      const adminId = new mongoose.Types.ObjectId();
      
      // Create multiple audit logs
      for (let i = 0; i < 5; i++) {
        await ReportAuditLog.create({
          adminId,
          action: i % 2 === 0 ? 'view' : 'download',
          reportType: 'dashboard',
          dateRange: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-31'),
          },
          details: { status: 'success' },
        });
      }

      // Query using the compound index
      const result = await ReportAuditLog.find({
        adminId,
        action: 'view',
      }).sort({ timestamp: -1 });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should efficiently query EmailPreference by subscribed and frequency', async () => {
      // Create multiple preferences
      for (let i = 0; i < 5; i++) {
        await EmailPreference.create({
          adminId: new mongoose.Types.ObjectId(),
          email: `admin${i}@example.com`,
          subscribed: i % 2 === 0,
          frequency: 'weekly',
        });
      }

      // Query using the compound index
      const result = await EmailPreference.find({
        subscribed: true,
        frequency: 'weekly',
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should efficiently query EmailDeliveryLog by finalStatus', async () => {
      // Create multiple delivery logs
      for (let i = 0; i < 5; i++) {
        await EmailDeliveryLog.create({
          jobId: `job-${i}`,
          adminId: new mongoose.Types.ObjectId(),
          email: `admin${i}@example.com`,
          reportType: 'weekly-summary',
          dateRange: {
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-07'),
          },
          attempts: [{ attemptNumber: 1, status: 'sent' }],
          finalStatus: i % 2 === 0 ? 'delivered' : 'failed',
        });
      }

      // Query using the index
      const result = await EmailDeliveryLog.find({
        finalStatus: 'delivered',
      }).sort({ createdAt: -1 });

      expect(result.length).toBeGreaterThan(0);
    });
  });
});

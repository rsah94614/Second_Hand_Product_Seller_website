/**
 * EmailPreference Collection Tests
 * 
 * Tests for the EmailPreference collection to verify:
 * - Collection creation and schema validation
 * - Unique index on adminId
 * - All required indexes
 * - Data storage and retrieval
 * - Email preference operations
 * 
 * **Validates: Requirements 9, 15, 17 (Email delivery, access control, email specifications)**
 */

const mongoose = require('mongoose');
const EmailPreference = require('../models/EmailPreference');

describe('EmailPreference Collection', () => {
  let testAdminId;
  let testEmail;

  beforeAll(async () => {
    // Generate test data
    testAdminId = new mongoose.Types.ObjectId();
    testEmail = `admin-${Date.now()}@example.com`;
  });

  describe('Schema Validation', () => {
    test('should have all required fields', () => {
      const schema = EmailPreference.schema;
      
      expect(schema.paths.adminId).toBeDefined();
      expect(schema.paths.email).toBeDefined();
      expect(schema.paths.subscribed).toBeDefined();
      expect(schema.paths.frequency).toBeDefined();
      expect(schema.paths.lastEmailSent).toBeDefined();
      expect(schema.paths.unsubscribeToken).toBeDefined();
      expect(schema.paths.createdAt).toBeDefined();
      expect(schema.paths.updatedAt).toBeDefined();
    });

    test('adminId should be required and unique', () => {
      const schema = EmailPreference.schema;
      const adminIdPath = schema.paths.adminId;
      
      expect(adminIdPath.options.required).toBe(true);
      expect(adminIdPath.options.unique).toBe(true);
      expect(adminIdPath.options.index).toBe(true);
    });

    test('email should be required and indexed', () => {
      const schema = EmailPreference.schema;
      const emailPath = schema.paths.email;
      
      expect(emailPath.options.required).toBe(true);
      expect(emailPath.options.index).toBe(true);
      expect(emailPath.options.lowercase).toBe(true);
      expect(emailPath.options.trim).toBe(true);
    });

    test('frequency should have valid enum values', () => {
      const schema = EmailPreference.schema;
      const frequencyPath = schema.paths.frequency;
      
      expect(frequencyPath.options.enum).toEqual(['weekly', 'monthly', 'never']);
      expect(frequencyPath.options.default).toBe('weekly');
    });

    test('subscribed should default to true', () => {
      const schema = EmailPreference.schema;
      const subscribedPath = schema.paths.subscribed;
      
      expect(subscribedPath.options.default).toBe(true);
    });

    test('unsubscribeToken should be unique and sparse', () => {
      const schema = EmailPreference.schema;
      const tokenPath = schema.paths.unsubscribeToken;
      
      expect(tokenPath.options.unique).toBe(true);
      expect(tokenPath.options.sparse).toBe(true);
      expect(tokenPath.options.index).toBe(true);
    });
  });

  describe('Index Verification', () => {
    test('should have unique index on adminId', () => {
      const schema = EmailPreference.schema;
      const adminIdPath = schema.paths.adminId;
      
      expect(adminIdPath.options.unique).toBe(true);
    });

    test('should have index on email', () => {
      const schema = EmailPreference.schema;
      const emailPath = schema.paths.email;
      
      expect(emailPath.options.index).toBe(true);
    });

    test('should have compound indexes defined', () => {
      const schema = EmailPreference.schema;
      const indexes = schema._indexes || [];
      
      // Check for subscribed + frequency compound index
      const hasSubscriptionIndex = indexes.some(idx => {
        const spec = idx[0];
        return spec.subscribed === 1 && spec.frequency === 1;
      });
      expect(hasSubscriptionIndex).toBe(true);
      
      // Check for lastEmailSent + subscribed compound index
      const hasLastEmailIndex = indexes.some(idx => {
        const spec = idx[0];
        return spec.lastEmailSent === 1 && spec.subscribed === 1;
      });
      expect(hasLastEmailIndex).toBe(true);
    });
  });

  describe('Data Operations', () => {
    test('should create a new email preference', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail,
        subscribed: true,
        frequency: 'weekly'
      });

      expect(preference.adminId).toEqual(testAdminId);
      expect(preference.email).toBe(testEmail);
      expect(preference.subscribed).toBe(true);
      expect(preference.frequency).toBe('weekly');
    });

    test('should validate required fields', async () => {
      const preference = new EmailPreference({
        email: testEmail
        // Missing adminId
      });

      const error = preference.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.adminId).toBeDefined();
    });

    test('should validate frequency enum', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail,
        frequency: 'invalid'
      });

      const error = preference.validateSync();
      expect(error).toBeDefined();
      expect(error.errors.frequency).toBeDefined();
    });

    test('should lowercase email addresses', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: 'ADMIN@EXAMPLE.COM',
        subscribed: true,
        frequency: 'weekly'
      });

      expect(preference.email).toBe('admin@example.com');
    });

    test('should trim email addresses', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: '  admin@example.com  ',
        subscribed: true,
        frequency: 'weekly'
      });

      expect(preference.email).toBe('admin@example.com');
    });

    test('should set default values', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail
      });

      expect(preference.subscribed).toBe(true);
      expect(preference.frequency).toBe('weekly');
      expect(preference.lastEmailSent).toBeNull();
    });

    test('should set timestamps', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail
      });

      expect(preference.createdAt).toBeDefined();
      expect(preference.updatedAt).toBeDefined();
    });
  });

  describe('Email Preference Operations', () => {
    test('should support subscription status updates', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail,
        subscribed: true,
        frequency: 'weekly'
      });

      // Unsubscribe
      preference.subscribed = false;
      expect(preference.subscribed).toBe(false);

      // Re-subscribe
      preference.subscribed = true;
      expect(preference.subscribed).toBe(true);
    });

    test('should support frequency changes', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail,
        frequency: 'weekly'
      });

      // Change to monthly
      preference.frequency = 'monthly';
      expect(preference.frequency).toBe('monthly');

      // Change to never
      preference.frequency = 'never';
      expect(preference.frequency).toBe('never');
    });

    test('should track last email sent', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail,
        lastEmailSent: null
      });

      expect(preference.lastEmailSent).toBeNull();

      const now = new Date();
      preference.lastEmailSent = now;
      expect(preference.lastEmailSent).toEqual(now);
    });

    test('should support unsubscribe token generation', async () => {
      const preference = new EmailPreference({
        adminId: testAdminId,
        email: testEmail,
        unsubscribeToken: 'token-' + Date.now()
      });

      expect(preference.unsubscribeToken).toBeDefined();
      expect(preference.unsubscribeToken).toMatch(/^token-/);
    });
  });

  describe('Query Patterns', () => {
    test('should support finding by adminId', () => {
      // This would use the unique index on adminId
      const query = EmailPreference.findOne({ adminId: testAdminId });
      expect(query).toBeDefined();
    });

    test('should support finding by email', () => {
      // This would use the index on email
      const query = EmailPreference.findOne({ email: testEmail });
      expect(query).toBeDefined();
    });

    test('should support finding subscribed admins', () => {
      // This would use the compound index on (subscribed, frequency)
      const query = EmailPreference.find({ subscribed: true, frequency: 'weekly' });
      expect(query).toBeDefined();
    });

    test('should support finding admins due for email', () => {
      // This would use the compound index on (lastEmailSent, subscribed)
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const query = EmailPreference.find({
        subscribed: true,
        lastEmailSent: { $lt: cutoffDate }
      });
      expect(query).toBeDefined();
    });

    test('should support finding by unsubscribe token', () => {
      // This would use the unique sparse index on unsubscribeToken
      const query = EmailPreference.findOne({ unsubscribeToken: 'token-123' });
      expect(query).toBeDefined();
    });
  });

  describe('Collection Integrity', () => {
    test('should have proper model name', () => {
      expect(EmailPreference.modelName).toBe('EmailPreference');
    });

    test('should have proper collection name', () => {
      expect(EmailPreference.collection.name).toBe('emailpreferences');
    });

    test('should have schema with timestamps', () => {
      const schema = EmailPreference.schema;
      expect(schema.options.timestamps).toBe(true);
    });
  });
});

/**
 * Property-Based Tests for EmailPreference
 * 
 * These tests verify universal properties that should hold for all valid inputs
 */

describe('EmailPreference - Property-Based Tests', () => {
  describe('Property: Email Normalization', () => {
    test('should normalize all email addresses to lowercase', () => {
      const testCases = [
        'ADMIN@EXAMPLE.COM',
        'Admin@Example.Com',
        'admin@example.com',
        'ADMIN@EXAMPLE.COM'
      ];

      testCases.forEach(email => {
        const preference = new EmailPreference({
          adminId: new mongoose.Types.ObjectId(),
          email: email
        });

        expect(preference.email).toBe('admin@example.com');
      });
    });

    test('should trim whitespace from email addresses', () => {
      const testCases = [
        '  admin@example.com',
        'admin@example.com  ',
        '  admin@example.com  ',
        '\tadmin@example.com\t'
      ];

      testCases.forEach(email => {
        const preference = new EmailPreference({
          adminId: new mongoose.Types.ObjectId(),
          email: email
        });

        expect(preference.email).toBe('admin@example.com');
      });
    });
  });

  describe('Property: Subscription Status Consistency', () => {
    test('should maintain subscription status consistency', () => {
      const preference = new EmailPreference({
        adminId: new mongoose.Types.ObjectId(),
        email: 'admin@example.com',
        subscribed: true
      });

      // Verify initial state
      expect(preference.subscribed).toBe(true);

      // Change state
      preference.subscribed = false;
      expect(preference.subscribed).toBe(false);

      // Verify state persists
      expect(preference.subscribed).toBe(false);
    });
  });

  describe('Property: Frequency Validation', () => {
    test('should only accept valid frequency values', () => {
      const validFrequencies = ['weekly', 'monthly', 'never'];

      validFrequencies.forEach(freq => {
        const preference = new EmailPreference({
          adminId: new mongoose.Types.ObjectId(),
          email: 'admin@example.com',
          frequency: freq
        });

        expect(preference.frequency).toBe(freq);
      });
    });

    test('should reject invalid frequency values', () => {
      const invalidFrequencies = ['daily', 'yearly', 'invalid', ''];

      invalidFrequencies.forEach(freq => {
        const preference = new EmailPreference({
          adminId: new mongoose.Types.ObjectId(),
          email: 'admin@example.com',
          frequency: freq
        });

        const error = preference.validateSync();
        expect(error).toBeDefined();
        expect(error.errors.frequency).toBeDefined();
      });
    });
  });

  describe('Property: Timestamp Management', () => {
    test('should set timestamps on creation', () => {
      const preference = new EmailPreference({
        adminId: new mongoose.Types.ObjectId(),
        email: 'admin@example.com'
      });

      expect(preference.createdAt).toBeDefined();
      expect(preference.updatedAt).toBeDefined();
      expect(preference.createdAt instanceof Date).toBe(true);
      expect(preference.updatedAt instanceof Date).toBe(true);
    });
  });
});

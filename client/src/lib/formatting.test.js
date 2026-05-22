import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatNumber,
  formatNumberWithSeparators,
  formatPercentage,
  formatDate,
  formatDateRange,
  calculateAbsoluteChange,
  calculatePercentageChange,
  getTrendIndicator,
  getTrendColor,
  getPresetDateRange,
  validateDateRange,
  parseDate,
} from './formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('formats currency with default 2 decimals', () => {
      expect(formatCurrency(100000)).toBe('₹1,00,000.00');
    });

    it('formats currency with custom decimals', () => {
      expect(formatCurrency(100000, 0)).toBe('₹1,00,000');
    });

    it('handles zero value', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    it('handles invalid values', () => {
      expect(formatCurrency(NaN)).toBe('₹0.00');
      expect(formatCurrency(undefined)).toBe('₹0.00');
    });
  });

  describe('formatNumber', () => {
    it('abbreviates millions', () => {
      expect(formatNumber(1200000)).toBe('1.2M');
    });

    it('abbreviates thousands', () => {
      expect(formatNumber(5000)).toBe('5.0K');
    });

    it('returns plain number for values < 1000', () => {
      expect(formatNumber(500)).toBe('500');
    });

    it('handles custom decimals', () => {
      expect(formatNumber(1234567, 2)).toBe('1.23M');
    });
  });

  describe('formatNumberWithSeparators', () => {
    it('formats with Indian style separators', () => {
      expect(formatNumberWithSeparators(1000000)).toBe('10,00,000');
    });

    it('handles decimals', () => {
      expect(formatNumberWithSeparators(1000000.5, 1)).toBe('10,00,000.5');
    });

    it('handles zero', () => {
      expect(formatNumberWithSeparators(0)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('formats percentage with default 1 decimal', () => {
      expect(formatPercentage(45.678)).toBe('45.7%');
    });

    it('converts decimal to percentage', () => {
      expect(formatPercentage(0.456)).toBe('45.6%');
    });

    it('handles zero', () => {
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('formatDate', () => {
    it('formats date as DD/MM/YYYY', () => {
      const date = new Date('2024-03-15');
      expect(formatDate(date)).toBe('15/03/2024');
    });

    it('formats ISO string date', () => {
      expect(formatDate('2024-03-15')).toBe('15/03/2024');
    });

    it('handles invalid date', () => {
      expect(formatDate('invalid')).toBe('');
    });
  });

  describe('formatDateRange', () => {
    it('formats date range correctly', () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      expect(formatDateRange(start, end)).toBe('01/03/2024 - 31/03/2024');
    });
  });

  describe('calculateAbsoluteChange', () => {
    it('calculates positive change', () => {
      expect(calculateAbsoluteChange(150, 100)).toBe(50);
    });

    it('calculates negative change', () => {
      expect(calculateAbsoluteChange(80, 100)).toBe(-20);
    });

    it('handles invalid values', () => {
      expect(calculateAbsoluteChange(NaN, 100)).toBe(0);
    });
  });

  describe('calculatePercentageChange', () => {
    it('calculates percentage change correctly', () => {
      expect(calculatePercentageChange(150, 100)).toBe(50);
    });

    it('handles zero previous value', () => {
      expect(calculatePercentageChange(100, 0)).toBe(100);
      expect(calculatePercentageChange(0, 0)).toBe(0);
    });

    it('calculates negative percentage change', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20);
    });
  });

  describe('getTrendIndicator', () => {
    it('returns "up" for positive change', () => {
      expect(getTrendIndicator(5)).toBe('up');
    });

    it('returns "down" for negative change', () => {
      expect(getTrendIndicator(-5)).toBe('down');
    });

    it('returns "neutral" for zero change', () => {
      expect(getTrendIndicator(0)).toBe('neutral');
    });
  });

  describe('getTrendColor', () => {
    it('returns green color for positive change', () => {
      expect(getTrendColor(5)).toBe('text-emerald-600');
    });

    it('returns red color for negative change', () => {
      expect(getTrendColor(-5)).toBe('text-red-600');
    });

    it('returns gray color for neutral change', () => {
      expect(getTrendColor(0)).toBe('text-slate-600');
    });
  });

  describe('getPresetDateRange', () => {
    it('returns 7 day range', () => {
      const { startDate, endDate } = getPresetDateRange('7d');
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('returns 30 day range', () => {
      const { startDate, endDate } = getPresetDateRange('30d');
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it('returns 90 day range', () => {
      const { startDate, endDate } = getPresetDateRange('90d');
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(90);
    });

    it('returns 365 day range', () => {
      const { startDate, endDate } = getPresetDateRange('365d');
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(365);
    });
  });

  describe('validateDateRange', () => {
    it('validates correct date range', () => {
      const start = new Date('2024-03-01');
      const end = new Date('2024-03-31');
      const result = validateDateRange(start, end);
      expect(result.isValid).toBe(true);
    });

    it('rejects when start date is after end date', () => {
      const start = new Date('2024-03-31');
      const end = new Date('2024-03-01');
      const result = validateDateRange(start, end);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Start date must be before end date');
    });

    it('rejects when range exceeds max days', () => {
      const start = new Date('2023-01-01');
      const end = new Date('2024-12-31');
      const result = validateDateRange(start, end, 365);
      expect(result.isValid).toBe(false);
    });

    it('validates with string dates', () => {
      const result = validateDateRange('01/03/2024', '31/03/2024');
      expect(result.isValid).toBe(true);
    });
  });

  describe('parseDate', () => {
    it('parses DD/MM/YYYY format', () => {
      const date = parseDate('15/03/2024');
      expect(date?.getDate()).toBe(15);
      expect(date?.getMonth()).toBe(2); // 0-indexed
      expect(date?.getFullYear()).toBe(2024);
    });

    it('parses ISO format', () => {
      const date = parseDate('2024-03-15');
      expect(date?.getDate()).toBe(15);
      expect(date?.getMonth()).toBe(2);
      expect(date?.getFullYear()).toBe(2024);
    });

    it('returns null for invalid date', () => {
      expect(parseDate('invalid')).toBeNull();
      expect(parseDate('')).toBeNull();
    });
  });
});

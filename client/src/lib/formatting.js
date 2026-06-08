/**
 * Formatting utilities for Sales & Revenue Reports
 * Handles currency, numbers, percentages, and dates in Indian locale
 */

/**
 * Format currency value in Indian Rupees
 * @param {number} value - Numeric value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string (e.g., "₹1,00,000.00")
 */
export function formatCurrency(value, decimals = 2) {
  if (!Number.isFinite(value)) return '₹0.00';

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  return formatted;
}

/**
 * Format large numbers with abbreviations
 * @param {number} value - Numeric value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Abbreviated number (e.g., "1.2M", "500K")
 */
export function formatNumber(value, decimals = 1) {
  if (!Number.isFinite(value)) return '0';

  const absValue = Math.abs(value);

  if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + 'M';
  }
  if (absValue >= 1_000) {
    return (value / 1_000).toFixed(decimals) + 'K';
  }

  return Math.round(value).toString();
}

/**
 * Format number with thousand separators (Indian style)
 * @param {number} value - Numeric value to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number with separators (e.g., "1,00,000")
 */
export function formatNumberWithSeparators(value, decimals = 0) {
  if (!Number.isFinite(value)) return '0';

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage value
 * @param {number} value - Numeric value (0-100 or 0-1)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage (e.g., "45.5%")
 */
export function formatPercentage(value, decimals = 1) {
  if (!Number.isFinite(value)) return '0%';

  // If value is between 0 and 1, assume it's a decimal percentage
  const percentage = value <= 1 ? value * 100 : value;

  return percentage.toFixed(decimals) + '%';
}

/**
 * Format date as DD/MM/YYYY
 * @param {Date|string} date - Date object or ISO string
 * @returns {string} Formatted date string (e.g., "15/03/2024")
 */
export function formatDate(date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Format date range as "DD/MM/YYYY - DD/MM/YYYY"
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Formatted date range string
 */
export function formatDateRange(startDate, endDate) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Calculate absolute change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Absolute change (current - previous)
 */
export function calculateAbsoluteChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  return current - previous;
}

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change ((current - previous) / previous * 100)
 */
export function calculatePercentageChange(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0) return current === 0 ? 0 : 100;

  return ((current - previous) / previous) * 100;
}

/**
 * Get trend indicator (up/down/neutral)
 * @param {number} change - Percentage change value
 * @returns {string} Trend indicator: "up", "down", or "neutral"
 */
export function getTrendIndicator(change) {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
}

/**
 * Get trend color based on change
 * @param {number} change - Percentage change value
 * @returns {string} Color class: "text-emerald-600" for up, "text-red-600" for down, "text-slate-600" for neutral
 */
export function getTrendColor(change) {
  if (change > 0) return 'text-emerald-600';
  if (change < 0) return 'text-red-600';
  return 'text-slate-600';
}

/**
 * Get trend background color based on change
 * @param {number} change - Percentage change value
 * @returns {string} Background color class
 */
export function getTrendBgColor(change) {
  if (change > 0) return 'bg-emerald-100';
  if (change < 0) return 'bg-red-100';
  return 'bg-slate-100';
}

/**
 * Format metric value with appropriate formatting
 * @param {number} value - Numeric value
 * @param {string} type - Type of metric: "currency", "number", "percentage", "count"
 * @returns {string} Formatted value
 */
export function formatMetric(value, type = 'number') {
  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'count':
      return formatNumberWithSeparators(value, 0);
    case 'number':
    default:
      return formatNumber(value);
  }
}

/**
 * Parse date string to Date object
 * @param {string} dateString - Date string in DD/MM/YYYY or ISO format
 * @returns {Date|null} Date object or null if invalid
 */
export function parseDate(dateString) {
  if (!dateString) return null;

  // Try ISO format first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Get date range for preset options
 * @param {string} preset - Preset option: "7d", "30d", "90d", "365d"
 * @returns {Object} Object with startDate and endDate
 */
export function getPresetDateRange(preset) {
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);

  const startDate = new Date(endDate);

  switch (preset) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '365d':
      startDate.setDate(startDate.getDate() - 365);
      break;
  }

  return { startDate, endDate };
}

/**
 * Validate date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {number} maxDays - Maximum allowed days (default: 365)
 * @returns {Object} Object with isValid and error message if invalid
 */
export function validateDateRange(startDate, endDate, maxDays = 365) {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;

  if (!start || !end) {
    return { isValid: false, error: 'Invalid date format' };
  }

  if (start > end) {
    return { isValid: false, error: 'Start date must be before end date' };
  }

  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    return { isValid: false, error: `Date range cannot exceed ${maxDays} days` };
  }

  return { isValid: true };
}

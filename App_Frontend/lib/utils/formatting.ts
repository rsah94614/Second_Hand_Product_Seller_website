/**
 * Formatting utilities for Sales & Revenue Reports
 * Handles currency, numbers, percentages, and dates in Indian locale
 */

/**
 * Format currency value in Indian Rupees
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string (e.g., "₹1,00,000.00")
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (!Number.isFinite(value)) return "₹0.00";
  
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  
  return formatted;
}

/**
 * Format large numbers with abbreviations
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Abbreviated number (e.g., "1.2M", "500K")
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return "0";
  
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(decimals) + "M";
  }
  if (absValue >= 1_000) {
    return (value / 1_000).toFixed(decimals) + "K";
  }
  
  return Math.round(value).toString();
}

/**
 * Format number with thousand separators (Indian style)
 * @param value - Numeric value to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number with separators (e.g., "1,00,000")
 */
export function formatNumberWithSeparators(value: number, decimals: number = 0): string {
  if (!Number.isFinite(value)) return "0";
  
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage value
 * @param value - Numeric value (0-100 or 0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage (e.g., "45.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return "0%";
  
  // If value is between 0 and 1, assume it's a decimal percentage
  const percentage = value <= 1 ? value * 100 : value;
  
  return percentage.toFixed(decimals) + "%";
}

/**
 * Format date as DD/MM/YYYY
 * @param date - Date object or ISO string
 * @returns Formatted date string (e.g., "15/03/2024")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "";
  }
  
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format date range as "DD/MM/YYYY - DD/MM/YYYY"
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Calculate absolute change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Absolute change (current - previous)
 */
export function calculateAbsoluteChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  return current - previous;
}

/**
 * Calculate percentage change between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Percentage change ((current - previous) / previous * 100)
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  
  return ((current - previous) / previous) * 100;
}

/**
 * Get trend indicator (up/down/neutral)
 * @param change - Percentage change value
 * @returns Trend indicator: "up", "down", or "neutral"
 */
export function getTrendIndicator(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "neutral";
}

/**
 * Get trend color based on change
 * @param change - Percentage change value
 * @returns Color class: "text-emerald-600" for up, "text-red-600" for down, "text-slate-600" for neutral
 */
export function getTrendColor(change: number): string {
  if (change > 0) return "text-emerald-600 dark:text-emerald-400";
  if (change < 0) return "text-red-600 dark:text-red-400";
  return "text-slate-600 dark:text-slate-400";
}

/**
 * Get trend background color based on change
 * @param change - Percentage change value
 * @returns Background color class
 */
export function getTrendBgColor(change: number): string {
  if (change > 0) return "bg-emerald-100 dark:bg-emerald-900/30";
  if (change < 0) return "bg-red-100 dark:bg-red-900/30";
  return "bg-slate-100 dark:bg-slate-800";
}

/**
 * Format metric value with appropriate formatting
 * @param value - Numeric value
 * @param type - Type of metric: "currency", "number", "percentage", "count"
 * @returns Formatted value
 */
export function formatMetric(value: number, type: "currency" | "number" | "percentage" | "count" = "number"): string {
  switch (type) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return formatPercentage(value);
    case "count":
      return formatNumberWithSeparators(value, 0);
    case "number":
    default:
      return formatNumber(value);
  }
}

/**
 * Parse date string to Date object
 * @param dateString - Date string in DD/MM/YYYY or ISO format
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  // Try ISO format first
  const isoDate = new Date(dateString);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }
  
  // Try DD/MM/YYYY format
  const parts = dateString.split("/");
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
 * @param preset - Preset option: "7d", "30d", "90d", "365d"
 * @returns Object with startDate and endDate
 */
export function getPresetDateRange(preset: "7d" | "30d" | "90d" | "365d"): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(endDate);
  
  switch (preset) {
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    case "365d":
      startDate.setDate(startDate.getDate() - 365);
      break;
  }
  
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
}

/**
 * Validate date range
 * @param startDate - Start date
 * @param endDate - End date
 * @param maxDays - Maximum allowed days (default: 365)
 * @returns Object with isValid and error message if invalid
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string,
  maxDays: number = 365
): { isValid: boolean; error?: string } {
  const start = typeof startDate === "string" ? parseDate(startDate) : startDate;
  const end = typeof endDate === "string" ? parseDate(endDate) : endDate;
  
  if (!start || !end) {
    return { isValid: false, error: "Invalid date format" };
  }
  
  if (start > end) {
    return { isValid: false, error: "Start date must be before end date" };
  }
  
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > maxDays) {
    return { isValid: false, error: `Date range cannot exceed ${maxDays} days` };
  }
  
  return { isValid: true };
}

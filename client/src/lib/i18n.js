/**
 * Internationalization (i18n) Configuration
 * Supports multiple languages with fallback to English
 */

import en from '../locales/en.json';

// Available locales
const locales = {
  en: en,
  // Future locales can be added here
  // hi: require('../locales/hi.json'),
  // es: require('../locales/es.json'),
};

// Default locale
const DEFAULT_LOCALE = 'en';

// Current locale (can be changed dynamically)
let currentLocale = DEFAULT_LOCALE;

/**
 * Get the current locale
 * @returns {string} Current locale code
 */
export function getCurrentLocale() {
  return currentLocale;
}

/**
 * Set the current locale
 * @param {string} locale - Locale code (e.g., 'en', 'hi', 'es')
 */
export function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale;
    localStorage.setItem('locale', locale);
  } else {
    console.warn(`Locale '${locale}' not found. Using default locale '${DEFAULT_LOCALE}'`);
  }
}

/**
 * Initialize locale from localStorage or browser settings
 */
export function initializeLocale() {
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale && locales[savedLocale]) {
    currentLocale = savedLocale;
  } else {
    // Try to detect browser language
    const browserLang = navigator.language.split('-')[0];
    if (locales[browserLang]) {
      currentLocale = browserLang;
    }
  }
}

/**
 * Get a translation string
 * @param {string} key - Translation key (e.g., 'reports.topProducts')
 * @param {Object} params - Parameters to interpolate in the string
 * @returns {string} Translated string
 */
export function t(key, params = {}) {
  const keys = key.split('.');
  let value = locales[currentLocale];

  // Navigate through nested keys
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to English if key not found
      value = locales[DEFAULT_LOCALE];
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return key; // Return key if not found in any locale
        }
      }
      break;
    }
  }

  // Interpolate parameters
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  return typeof value === 'string' ? value : key;
}

/**
 * Get all available locales
 * @returns {Array} Array of locale codes
 */
export function getAvailableLocales() {
  return Object.keys(locales);
}

/**
 * Check if a locale is available
 * @param {string} locale - Locale code
 * @returns {boolean} True if locale is available
 */
export function isLocaleAvailable(locale) {
  return locale in locales;
}

// Initialize locale on module load
initializeLocale();

export default {
  getCurrentLocale,
  setLocale,
  initializeLocale,
  t,
  getAvailableLocales,
  isLocaleAvailable,
};

/**
 * formatCurrency.js
 *
 * All prices stored in the database are in USD.
 * This utility converts them to the requested currency and formats using
 * the browser-native Intl.NumberFormat API.
 *
 * Supported currencies:
 *   INR — Indian Rupee   (en-IN, ₹)   default
 *   USD — US Dollar      (en-US, $)
 *   EUR — Euro           (de-DE, €)
 *   GBP — British Pound  (en-GB, £)
 */

/** Fixed exchange rates relative to 1 USD */
export const EXCHANGE_RATES = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.79,
};

/** Locale to use for each currency code */
const CURRENCY_LOCALES = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
  GBP: 'en-GB',
};

/** Human-readable labels for the UI selector */
export const CURRENCY_OPTIONS = [
  { code: 'INR', label: 'INR (₹)', symbol: '₹' },
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
];

/**
 * Convert a USD price to the target currency and return a formatted string.
 *
 * @param {number} usdPrice       — raw price from DB (USD)
 * @param {string} [currency='INR'] — target ISO 4217 currency code
 * @returns {string}              — e.g. "₹29,069" or "$349.99"
 */
export const formatCurrency = (usdPrice, currency = 'INR') => {
  const rate   = EXCHANGE_RATES[currency] ?? 1;
  const locale = CURRENCY_LOCALES[currency] ?? 'en-US';
  const converted = usdPrice * rate;

  // For INR we suppress decimal cents; other currencies keep 2 dp
  const fractionDigits = currency === 'INR' ? 0 : 2;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(converted);
  } catch {
    // Graceful fallback if the browser doesn't support the locale/currency
    return `${currency} ${converted.toFixed(fractionDigits)}`;
  }
};

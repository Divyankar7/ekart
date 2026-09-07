import { createContext, useCallback, useContext, useState } from 'react';
import { formatCurrency, CURRENCY_OPTIONS } from '../utils/formatCurrency';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    // Persist the user's last choice across refreshes; default to INR
    return localStorage.getItem('ekart_currency') ?? 'INR';
  });

  const changeCurrency = useCallback((code) => {
    if (CURRENCY_OPTIONS.some((o) => o.code === code)) {
      setCurrency(code);
      localStorage.setItem('ekart_currency', code);
    }
  }, []);

  /**
   * format(usdPrice) — converts a USD price and returns a formatted string
   * in the currently selected currency.
   */
  const format = useCallback(
    (usdPrice) => formatCurrency(usdPrice, currency),
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, changeCurrency, format, CURRENCY_OPTIONS }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>');
  return ctx;
};

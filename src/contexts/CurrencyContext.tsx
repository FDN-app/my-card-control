import React, { createContext, useContext, useState, useCallback } from 'react';

export type CurrencyCode = 'ARS' | 'USD' | 'EUR';

interface Rates {
  ARS: number;
  USD: number;
  EUR: number;
}

const DEFAULT_RATES: Rates = { ARS: 1, USD: 0.001, EUR: 0.00092 };

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  ARS: '$',
  USD: 'U$S',
  EUR: '€',
};

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  ARS: 'es-AR',
  USD: 'en-US',
  EUR: 'de-DE',
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Rates;
  setRates: (r: Rates) => void;
  convert: (amountARS: number) => number;
  format: (amountARS: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() =>
    load<CurrencyCode>('cuotactrl_currency', 'ARS')
  );
  const [rates, setRatesState] = useState<Rates>(() =>
    load<Rates>('cuotactrl_rates', DEFAULT_RATES)
  );

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem('cuotactrl_currency', JSON.stringify(c));
  };

  const setRates = (r: Rates) => {
    setRatesState(r);
    localStorage.setItem('cuotactrl_rates', JSON.stringify(r));
  };

  const convert = useCallback((amountARS: number) => {
    return amountARS * (rates[currency] ?? 1);
  }, [currency, rates]);

  const format = useCallback((amountARS: number) => {
    const converted = amountARS * (rates[currency] ?? 1);
    const locale = CURRENCY_LOCALES[currency];
    const sym = CURRENCY_SYMBOLS[currency];
    if (currency === 'ARS') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
      }).format(converted);
    }
    return `${sym} ${new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(converted)}`;
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider value={{
      currency, setCurrency, rates, setRates, convert, format,
      symbol: CURRENCY_SYMBOLS[currency],
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}

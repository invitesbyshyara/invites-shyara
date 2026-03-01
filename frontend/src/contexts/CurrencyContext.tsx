import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export type Currency = "USD" | "EUR";

interface CurrencyContextType {
  currency: Currency;
  symbol: "$" | "€";
  setCurrency: (currency: Currency) => void;
  formatPrice: (cents: number) => string;
}

const STORAGE_KEY = "shyara_currency";
const DEFAULT_CURRENCY: Currency = "USD";

const CurrencyContext = createContext<CurrencyContextType | null>(null);

const getStoredCurrency = (): Currency => {
  if (typeof window === "undefined") {
    return DEFAULT_CURRENCY;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "EUR" ? "EUR" : "USD";
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(getStoredCurrency);

  const setCurrency = (nextCurrency: Currency) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  };

  const symbol = currency === "USD" ? "$" : "€";

  const value = useMemo<CurrencyContextType>(
    () => ({
      currency,
      symbol,
      setCurrency,
      formatPrice: (cents: number) => `${symbol}${(cents / 100).toFixed(2)}`,
    }),
    [currency, symbol],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/language-context';

export type Currency = 'FCFA' | 'USD' | 'EUR';

const CURRENCY_KEY = '@zando_currency';

// Taux de change approximatifs (1 FCFA = X devise)
const RATES: Record<Currency, number> = {
  FCFA: 1,
  USD: 1 / 600,   // 1 USD ≈ 600 FCFA
  EUR: 1 / 655.96, // 1 EUR ≈ 655,96 FCFA
};

const SYMBOLS: Record<Currency, string> = {
  FCFA: 'FCFA',
  USD: '$',
  EUR: '€',
};

export function useCurrency() {
  const { language } = useLanguage();
  const [currency, setCurrencyState] = useState<Currency>('FCFA');

  // Charger la devise depuis AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(CURRENCY_KEY);
        if (saved === 'FCFA' || saved === 'USD' || saved === 'EUR') {
          setCurrencyState(saved);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const setCurrency = useCallback(async (c: Currency) => {
    setCurrencyState(c);
    try {
      await AsyncStorage.setItem(CURRENCY_KEY, c);
    } catch { /* ignore */ }
  }, []);

  // Convertir un montant FCFA vers la devise active
  const convert = useCallback(
    (amountFcfa: number): number => {
      return amountFcfa * RATES[currency];
    },
    [currency]
  );

  // Formater un montant dans la devise active
  const format = useCallback(
    (amountFcfa: number, options?: { decimals?: number }): string => {
      const decimals = options?.decimals ?? (currency === 'FCFA' ? 0 : 2);
      const converted = convert(amountFcfa);
      const locale = language === 'lingala' ? 'fr-FR' : language === 'en' ? 'en-US' : 'fr-FR';

      if (currency === 'FCFA') {
        return `${Math.round(converted).toLocaleString(locale)} FCFA`;
      }
      return `${SYMBOLS[currency]}${converted.toFixed(decimals)}`;
    },
    [currency, convert, language]
  );

// Formater avec symbole devant (pour les prix produits)
  const formatPrice = useCallback(
    (amountFcfa: number): string => {
      if (currency === 'FCFA') {
        return `${Math.round(amountFcfa).toLocaleString('fr-FR')} FCFA`;
      }
      const converted = convert(amountFcfa);
      return `${SYMBOLS[currency]}${converted.toFixed(2)}`;
    },
    [currency, convert]
  );

  // Symbole de la devise actuelle
  const symbol = SYMBOLS[currency];

  return {
    currency,
    setCurrency,
    convert,
    format,
    formatPrice,
    symbol,
    isFcfa: currency === 'FCFA',
  };
}

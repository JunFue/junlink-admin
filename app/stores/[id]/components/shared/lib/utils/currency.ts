export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'PHP' | 'JPY';

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

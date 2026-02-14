import { Currency } from '@/entities/billing/billing.entities';

export function formatPrice(cents: number, currency: Currency = 'USD', locale?: string): string {
  const amount = cents / 100;

  const resolvedLocale = locale ?? (currency === 'EUR' ? 'de-DE' : 'en-US');

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

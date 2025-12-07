import { Currency } from '@/entities/billing/billing.entities';

export function formatPrice(cents: number, currency: Currency = 'USD'): string {
  const amount = cents / 100;

  const locale = currency === 'EUR' ? 'de-DE' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

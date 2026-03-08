import { Currency } from '@/entities/billing/billing.entities';
import type { SupportedLanguages } from '@/constants/i18n';

export function formatPrice(cents: number, currency: Currency = 'USD', locale?: SupportedLanguages): string {
  const amount = cents / 100;

  const resolvedLocale = locale ?? (currency === 'EUR' ? 'de-DE' : 'en-US');

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

import type { SupportedLanguages } from '@/constants/i18n';
import { formatNumber } from '@/utils/formatters';

// Largest displayed event tier; anything above (the contact-sales range) is shown as "N+".
const EVENT_DISPLAY_CAP = 10_000_000;

/** Format event count for pricing UI */
export function formatEventCount(value: number, locale?: SupportedLanguages): string {
  const suffix = value > EVENT_DISPLAY_CAP ? '+' : '';
  return formatNumber(Math.min(value, EVENT_DISPLAY_CAP), locale, { maximumFractionDigits: 0 }) + suffix;
}

export function formatPrice(cents: number, currency: string = 'USD', locale?: SupportedLanguages): string {
  const amount = cents / 100;

  const resolvedLocale = locale ?? (currency === 'EUR' ? 'de-DE' : 'en-US');

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}

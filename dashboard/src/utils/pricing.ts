import type { SupportedLanguages } from '@/constants/i18n';

// Largest displayed event tier; anything above (the contact-sales range) is shown as "N+".
export const EVENT_DISPLAY_CAP = 10_000_000;

const COMPACT_UNITS: Record<SupportedLanguages, { thousand: string; million: string }> = {
  en: { thousand: 'K', million: 'M' },
  da: { thousand: '\u00a0t', million: '\u00a0mio.' },
  it: { thousand: 'K', million: '\u00a0Mln' },
  nb: { thousand: 'k', million: '\u00a0mill.' },
};

export function compactEventParts(value: number, locale: SupportedLanguages = 'en') {
  const capped = Math.min(value, EVENT_DISPLAY_CAP);
  const plus = value > EVENT_DISPLAY_CAP ? '+' : '';
  const { thousand, million } = COMPACT_UNITS[locale];
  if (capped >= 999_500) return { scaled: Math.round(capped / 1_000_000), suffix: million + plus };
  if (capped >= 999.5) return { scaled: Math.round(capped / 1_000), suffix: thousand + plus };
  return { scaled: Math.round(capped), suffix: plus };
}

/** Format event count for pricing UI */
export function formatEventCount(value: number, locale: SupportedLanguages = 'en'): string {
  const { scaled, suffix } = compactEventParts(value, locale);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(scaled) + suffix;
}

export function formatPrice(cents: number, currency: string = 'USD', locale?: SupportedLanguages): string {
  const amount = cents / 100;

  const resolvedLocale = locale ?? (currency === 'EUR' ? 'de-DE' : 'en-US');

  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}

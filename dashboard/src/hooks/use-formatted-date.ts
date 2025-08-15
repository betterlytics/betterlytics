'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

// To avoid hydration failed issues when stringifying date values
export function useFormattedDate(
  date?: Date,
  config?: { locales?: Intl.LocalesArgument; options?: Intl.DateTimeFormatOptions },
) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);
  const t = useTranslations('misc');
  // Not using useMemo here, because we need to delay the formatting until after the component has mounted
  useEffect(() => {
    const result = date ? date.toLocaleDateString(config?.locales, config?.options) : t('unknown');

    setFormattedDate(result);
  }, [date, config?.locales, config?.options, t('unknown')]);

  const loading = formattedDate === null;

  return { formattedDate, loading };
}

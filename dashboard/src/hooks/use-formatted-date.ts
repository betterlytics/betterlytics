'use client';
import { useEffect, useState } from 'react';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

// To avoid hydration failed issues when stringifying date values
export function useFormattedDate(
  date?: Date,
  config?: { locales?: Intl.LocalesArgument; options?: Intl.DateTimeFormatOptions },
) {
  const { dictionary } = useDictionary();
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  // Not using useMemo here, because we need to delay the formatting until after the component has mounted
  useEffect(() => {
    const result = date ? date.toLocaleDateString(config?.locales, config?.options) : dictionary.misc.unknown;

    setFormattedDate(result);
  }, [date, config?.locales, config?.options, dictionary.misc.unknown]);

  const loading = formattedDate === null;

  return { formattedDate, loading };
}

'use client';
import { useDictionary } from '@/contexts/DictionaryContextProvider';
import { useEffect, useState } from 'react';

// To avoid hydration failed issues when printing date values
export default function LazyDate({
  date,
  locales,
  options,
}: {
  date?: Date;
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
}) {
  const { dictionary } = useDictionary();
  const [formattedDate, setFormattedDate] = useState<string>('');

  // Not using useMemo here, because we need to delay the formatting until after the component has mounted
  useEffect(() => {
    setFormattedDate(date ? date.toLocaleDateString(locales, options) : dictionary.misc.unknown);
  }, [date]);

  return <>{formattedDate || dictionary.misc.loading}</>;
}

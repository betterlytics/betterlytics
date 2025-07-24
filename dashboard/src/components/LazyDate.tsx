'use client';
import { useDictionary } from '@/contexts/DictionaryContextProvider';
import { interpolateReactTemplate } from '@/utils/reactTemplateStrings';
import { useEffect, useMemo, useState } from 'react';

type LazyDateProps = {
  date?: Date;
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
  formatted?:
    | ((formattedDate: string) => React.ReactNode)
    | [(formattedDate: string) => string, Record<string, React.ReactNode>];
};

export default function LazyDate({ date, locales, options, formatted }: LazyDateProps) {
  const { dictionary } = useDictionary();
  const [formattedDate, setFormattedDate] = useState<string>(dictionary.misc.loading);

  // Format date only after mount (useEffect instead of useMemo to avoid hydration mismatch)
  useEffect(() => {
    const value = date ? date.toLocaleDateString(locales, options) : dictionary.misc.unknown;
    setFormattedDate(value);
  }, [date, locales, options, dictionary.misc.unknown]);

  if (typeof formatted === 'function') {
    return <>{formatted(formattedDate)}</>;
  }

  if (Array.isArray(formatted)) {
    let [templateOrFn, interpolations] = formatted;
    const template = typeof templateOrFn === 'function' ? templateOrFn(formattedDate) : templateOrFn;

    if (!('date' in interpolations)) {
      interpolations = { ...interpolations, date: formattedDate };
    }

    return useMemo(() => interpolateReactTemplate(template, interpolations), [template, interpolations]);
  }

  return <>{formattedDate}</>;
}

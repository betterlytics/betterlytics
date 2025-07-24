'use client';
import { useDictionary } from '@/contexts/DictionaryContextProvider';
import { interpolateReactTemplate } from '@/utils/reactTemplateStrings';
import { useEffect, useMemo, useState, ReactNode } from 'react';

type LazyDateProps = {
  date?: Date;
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
  formatted?:
    | ((formattedDateString: string) => React.ReactNode)
    | [(formattedDateString: string) => string, Record<string, React.ReactNode>];
};

export default function LazyDate({ date, locales, options, formatted }: LazyDateProps) {
  const { dictionary } = useDictionary();
  const [formattedDate, setFormattedDate] = useState<string>(dictionary.misc.loading);

  // Format date only after mount (useEffect instead of useMemo to avoid hydration mismatch)
  useEffect(() => {
    const value = date ? date.toLocaleDateString(locales, options) : dictionary.misc.unknown;
    setFormattedDate(value);
  }, [date, locales, options, dictionary.misc.unknown]);

  const content: ReactNode = useMemo(() => {
    // If formatted is a function, pass formattedDate into it
    if (typeof formatted === 'function') {
      return formatted(formattedDate);
    }

    if (Array.isArray(formatted)) {
      const [templateOrFn, rawInterpolations] = formatted;

      const template = typeof templateOrFn === 'function' ? templateOrFn(formattedDate) : templateOrFn;

      const interpolations = {
        ...rawInterpolations,
        date: rawInterpolations.date ?? formattedDate,
      };

      return interpolateReactTemplate(template, interpolations);
    }

    return formattedDate;
  }, [formatted, formattedDate]);

  return <>{content}</>;
}

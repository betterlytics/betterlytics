import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { useFilterValueFormatter } from './use-filter-value-formatter';
import en from '../../messages/en.json';
import da from '../../messages/da.json';

const MESSAGES = { en, da };

function FormattedValue({ column, value }: { column: FilterColumn; value: string }) {
  const formatValue = useFilterValueFormatter();
  return <>{formatValue(column, value)}</>;
}

function format(column: FilterColumn, value: string, locale: keyof typeof MESSAGES = 'en') {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      <FormattedValue column={column} value={value} />
    </NextIntlClientProvider>,
  );
}

describe('useFilterValueFormatter', () => {
  it.each([
    ['ai', 'en', 'AI'],
    ['search', 'en', 'Search'],
    ['search', 'da', 'Søgning'],
    ['direct', 'da', 'Direkte'],
  ] as const)('shows referrer source %s in %s as the category label', (value, locale, expected) => {
    expect(format('referrer_source', value, locale)).toBe(expected);
  });

  it('capitalizes a referrer source outside the known categories', () => {
    expect(format('referrer_source', 'newsletter')).toBe('Newsletter');
  });

  it('leaves other columns unchanged', () => {
    expect(format('referrer_source_name', 'search')).toBe('search');
    expect(format('country_code', 'DK')).toBe('DK');
  });
});

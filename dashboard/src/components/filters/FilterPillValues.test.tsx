import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { FilterPillValues } from '@/components/filters/FilterPillValues';
import { obscuredValueCount } from '@/components/filters/pillValuesOverflow';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import en from '../../../messages/en.json';

function render(filter: Partial<QueryFilter>) {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider locale='en' messages={en}>
      <FilterPillValues
        filter={{
          id: 'f',
          column: 'url',
          operator: '=',
          values: ['/pricing', '/docs', '/blog', '/about'],
          ...filter,
        }}
        onOpen={() => {}}
      />
    </NextIntlClientProvider>,
  );
  const values = [
    ...html.matchAll(
      /data-pill-value=""[^>]*><span class="[^"]*overflow-clip[^"]*">(.*?)<\/span>(?:<span aria-hidden|<\/span>)/g,
    ),
  ].map(([, inner]) => inner.replace(/<[^>]+>/g, ''));
  return { html, values };
}

describe('FilterPillValues', () => {
  it('renders the final fold on the server: a ladder of values, one overflow probe, and no guessed count', () => {
    const { html, values } = render({});
    expect(values).toEqual(['/pricing,', '/docs,', '/blog,', '/about']);
    expect(html.match(/:last-child\]:shrink-\[1000000\]/g)).toHaveLength(3);
    expect(html.match(/data-pill-probe=""/g)).toHaveLength(1);
    expect(html).not.toMatch(/ more/);
  });

  it('keeps the probe copy silent and cheap: hidden from assistive tech, an icon placeholder instead of the icon', () => {
    const { html } = render({ column: 'country_code', values: ['DK', 'SE', 'NO'] });
    expect(html).toMatch(/aria-hidden="true"[^>]*>(?:<[^>]+>)*<span class="[^"]*w-\[1\.65em\]/);
    expect(html.match(/<svg/g)).toHaveLength(3);
    expect(html.match(/w-\[1\.65em\]/g)).toHaveLength(1);
  });

  it('counts values past the mount estimate in one trailing value the tooltip can detect', () => {
    const urls = Array.from({ length: 100 }, (_, index) => `/section/page-${index}/with-a-long-slug`);
    const estimated = render({ values: urls });
    const mounted = estimated.values.length - 1;
    expect(mounted).toBeLessThan(100);
    expect(estimated.values.at(-1)).toBe(`+${100 - mounted}`);
    expect(estimated.html.match(/data-pill-rest=""/g)).toHaveLength(1);

    const capped = render({ values: Array.from({ length: 200 }, () => 'DK') });
    expect(capped.values).toHaveLength(33);
    expect(capped.values.at(-1)).toBe('+168');
  });

  it('counts every value whose end passes the fade midpoint, the trailing value standing for the rest', () => {
    // Values end at these x positions, the folded ones at the 300px edge; label at 240 with a 40px fade, midpoint 220.
    expect(obscuredValueCount([70, 150, 210, 300], 220, 4)).toBe(1);
    expect(obscuredValueCount([70, 150, 230, 300], 220, 4)).toBe(2);
    expect(obscuredValueCount([70, 150, 210, 300, 300], 220, 40)).toBe(37);
    expect(obscuredValueCount([70, 150, 210], 220, 3)).toBe(0);
  });
});

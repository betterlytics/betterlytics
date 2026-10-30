import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { FilterPillValues } from '@/components/filters/FilterPillValues';
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
      /data-pill-value=""[^>]*><span class="[^"]*overflow-clip[^"]*">(.*?)<\/span><span aria-hidden/g,
    ),
  ].map(([, inner]) => inner.replace(/<[^>]+>/g, ''));
  const count = (label: string) => label.replace(/(\d+) more/, '$1');
  const labels = [...html.matchAll(/data-self="([^"]*)" data-after="([^"]*)" style="z-index:(\d+)"/g)].map(
    ([, self, after, z]) => `${count(self)}|${count(after)}@${z}`,
  );
  return { html, values, labels };
}

describe('FilterPillValues', () => {
  it('renders the final fold on the server: a ladder of values, each counting itself and what follows, earlier on top', () => {
    const { html, values, labels } = render({});
    expect(values).toEqual(['/pricing,', '/docs,', '/blog,', '/about']);
    expect(html.match(/:last-child\]:shrink-\[1000000\]/g)).toHaveLength(3);
    expect(labels).toEqual(['+4|+3@4', '+3|+2@3', '+2|+1@2', '+1|@1']);
  });

  it('keeps the probe copies silent and cheap: hidden from assistive tech, icon placeholders instead of icons', () => {
    const { html } = render({ column: 'country_code', values: ['DK', 'SE', 'NO'] });
    expect(html.match(/aria-hidden="true"[^>]*@container\/v/g)).toHaveLength(3);
    expect(html.match(/<svg/g)).toHaveLength(3);
    expect(html.match(/w-\[1\.65em\]/g)).toHaveLength(3);
  });

  it('counts values past the mount estimate in one trailing value the tooltip can detect', () => {
    const urls = Array.from({ length: 100 }, (_, index) => `/section/page-${index}/with-a-long-slug`);
    const estimated = render({ values: urls });
    const mounted = estimated.values.length - 1;
    expect(mounted).toBeLessThan(100);
    expect(estimated.values.at(-1)).toBe(`+${100 - mounted}`);
    expect(estimated.html.match(/data-pill-rest=""/g)).toHaveLength(1);
    expect(estimated.labels[0]).toBe(`+100|+99@${mounted + 1}`);
    expect(estimated.labels.at(-1)).toBe(`+${100 - mounted}|@1`);

    const capped = render({ values: Array.from({ length: 200 }, () => 'DK') });
    expect(capped.values).toHaveLength(33);
    expect(capped.values.at(-1)).toBe('+168');
  });
});

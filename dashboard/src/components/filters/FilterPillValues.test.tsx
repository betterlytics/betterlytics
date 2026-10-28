import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { FilterPillValues } from '@/components/filters/FilterPillValues';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import en from '../../../messages/en.json';

const urls = ['/pricing', '/docs', '/blog', '/about'];

function render(filter: Partial<QueryFilter>) {
  const html = renderToStaticMarkup(
    <NextIntlClientProvider locale='en' messages={en}>
      <FilterPillValues
        filter={{ id: 'f', column: 'url', operator: '=', values: urls, ...filter }}
        onOpen={() => {}}
      />
    </NextIntlClientProvider>,
  );
  const values = [
    ...html.matchAll(
      /data-pill-value=""[^>]*><span class="[^"]*overflow-clip[^"]*">(.*?)<\/span><span aria-hidden/g,
    ),
  ].map(([, inner]) => inner.replace(/<[^>]+>/g, ''));
  const labels = [...html.matchAll(/style="z-index:(\d+)">(?:\+(\d+) more)?</g)].map(
    ([, z, count]) => `${count ? `+${count}` : ''}@${z}`,
  );
  return { html, values, labels };
}

describe('FilterPillValues', () => {
  it('mounts every value in a ladder with commas between them', () => {
    const { html, values } = render({});
    expect(values).toEqual(['/pricing,', '/docs,', '/blog,', '/about']);
    expect(html.match(/:last-child\]:shrink-\[1000000\]/g)).toHaveLength(3);
  });

  it('pre-renders one label counting from each value and one counting after it, earlier values on top', () => {
    const { labels } = render({});
    expect(labels).toEqual(['+4@8', '+3@9', '+3@6', '+2@7', '+2@4', '+1@5', '+1@2', '@3']);
  });

  it('fades the cut tail from each label, only while that value has width', () => {
    const { html } = render({});
    expect(html.match(/@min-\[0\.5px\]\/v:before:block/g)).toHaveLength(8);
    expect(html).toContain('before:right-full');
  });

  it('gives a lone value no comma and a text-less label for its cut tail', () => {
    const { values, labels } = render({ values: ['/pricing'] });
    expect(values).toEqual(['/pricing']);
    expect(labels).toEqual(['+1@2', '@3']);
  });

  it('counts values past the mount estimate in a trailing value', () => {
    const many = Array.from({ length: 100 }, (_, index) => `/section/page-${index}/with-a-long-slug`);
    const { html, values, labels } = render({ values: many });
    const mounted = values.length - 1;
    expect(mounted).toBeLessThan(100);
    expect(values.at(-1)).toBe(`+${100 - mounted}`);
    expect(html.match(/data-pill-rest=""/g)).toHaveLength(1);
    expect(labels[0]).toBe('+100@' + 2 * (mounted + 1));
    expect(labels.at(-2)).toBe(`+${100 - mounted}@2`);
  });

  it('offers a placeholder instead of an empty button for no values', () => {
    const { html } = render({ values: [] });
    expect(html).toContain('Select a value');
    expect(html).not.toContain('data-pill-values');
  });

  it('measures iconised values with an empty box of the icon footprint, not a second icon', () => {
    const { html } = render({ column: 'country_code', values: ['DK', 'SE', 'NO'] });
    expect(html.match(/<svg/g)).toHaveLength(3);
    expect(html.match(/w-\[1\.65em\]/g)).toHaveLength(3);
  });

  it('keeps probes out of the accessibility tree', () => {
    const { html } = render({});
    expect(html.match(/aria-hidden="true"[^>]*@container\/v/g)).toHaveLength(4);
  });
});

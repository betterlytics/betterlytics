import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { MidEllipsisText } from './MidEllipsisText';

const LONG = 'https://example.com/some/deeply/nested/path/that/overflows/every/container';

describe('MidEllipsisText SSR contract', () => {
  it('renders the full value with the CSS backstop before any measurement', () => {
    const html = renderToString(createElement(MidEllipsisText, { value: LONG }));
    expect(html).toContain('overflows/every/container');
    expect(html).toContain('truncate');
    expect(html).toContain('min-w-0');
    expect(html).not.toContain('aria-label');
    expect(html).not.toContain('title=');
  });

  it('merges caller className after defaults', () => {
    const html = renderToString(createElement(MidEllipsisText, { value: LONG, className: 'text-xs' }));
    expect(html).toContain('text-xs');
    expect(html).toContain('truncate');
  });
});

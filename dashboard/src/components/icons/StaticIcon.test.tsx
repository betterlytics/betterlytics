import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticIcon } from './StaticIcon';

describe('StaticIcon', () => {
  it('renders colored icons as a decorative img', () => {
    const html = renderToStaticMarkup(<StaticIcon src='/browser-icons/chrome.svg' className='h-3.5 w-3.5' />);
    expect(html).toContain('<img');
    expect(html).toContain('src="/browser-icons/chrome.svg"');
    expect(html).toContain('alt=""');
  });

  it('renders mono icons as a decorative masked span inheriting currentColor', () => {
    const html = renderToStaticMarkup(<StaticIcon src='/os-icons/windows.svg' mono className='h-3.5 w-3.5' />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
    expect(html).not.toContain('aria-label');
    expect(html).toContain('mask-image:url(/os-icons/windows.svg)');
    expect(html).toContain('mask-size:100% 100%');
    expect(html).toContain('bg-current');
    expect(html).not.toContain('<img');
  });
});

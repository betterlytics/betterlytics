import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticIcon } from './StaticIcon';

describe('StaticIcon', () => {
  it('renders colored icons as an img', () => {
    const html = renderToStaticMarkup(
      <StaticIcon src='/browser-icons/chrome.svg' label='Google Chrome' className='h-3.5 w-3.5' />,
    );
    expect(html).toContain('<img');
    expect(html).toContain('src="/browser-icons/chrome.svg"');
    expect(html).toContain('alt="Google Chrome"');
  });

  it('renders mono icons as a masked span inheriting currentColor', () => {
    const html = renderToStaticMarkup(
      <StaticIcon src='/os-icons/windows.svg' label='Windows' mono className='h-3.5 w-3.5' />,
    );
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Windows"');
    expect(html).toContain('mask-image:url(/os-icons/windows.svg)');
    expect(html).toContain('bg-current');
    expect(html).not.toContain('<img');
  });
});

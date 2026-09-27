import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { OSIcon } from './OSIcon';

function renderTags(name: string) {
  const html = renderToStaticMarkup(<OSIcon name={name} className='h-3.5 w-3.5' />);
  return [...html.matchAll(/<(img|span|svg)\b[^>]*>/g)].map(([tag, element]) => ({
    element,
    tag,
    classes: (tag.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/),
  }));
}

describe('OSIcon', () => {
  it('renders a single mono icon for both themes when there is no dark variant', () => {
    const tags = renderTags('Windows');
    expect(tags).toHaveLength(1);
    expect(tags[0].element).toBe('span');
    expect(tags[0].tag).toContain('mask-image:url(/os-icons/windows.svg)');
    expect(tags[0].classes).not.toContain('hidden');
    expect(tags[0].classes).not.toContain('dark:hidden');
  });

  it.each([
    ['macOS', 'apple.svg', 'apple-dark.svg'],
    ['iOS', 'apple.svg', 'apple-dark.svg'],
    ['Linux', 'linux.svg', 'linux-dark.svg'],
  ])(
    'renders %s as a light img hidden in dark mode and a dark mono span hidden in light mode',
    (name, light, dark) => {
      const [lightTag, darkTag, ...rest] = renderTags(name);
      expect(rest).toHaveLength(0);

      expect(lightTag.element).toBe('img');
      expect(lightTag.tag).toContain(`src="/os-icons/${light}"`);
      expect(lightTag.classes).toContain('dark:hidden');
      expect(lightTag.classes).not.toContain('hidden');

      expect(darkTag.element).toBe('span');
      expect(darkTag.tag).toContain(`mask-image:url(/os-icons/${dark})`);
      expect(darkTag.classes).toContain('hidden');
      expect(darkTag.classes).toContain('dark:inline-block');
      expect(darkTag.classes).not.toContain('inline-block');
    },
  );

  it('falls back to the Monitor glyph for unknown operating systems', () => {
    const tags = renderTags('TempleOS');
    expect(tags).toHaveLength(1);
    expect(tags[0].element).toBe('svg');
    expect(tags[0].classes).toContain('lucide-monitor');
  });
});

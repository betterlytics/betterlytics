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
  ])('renders %s as one element whose only dark-mode image is the mono variant', (name, light, dark) => {
    const tags = renderTags(name);
    expect(tags).toHaveLength(1);
    const [icon] = tags;

    expect(icon.element).toBe('span');
    expect(icon.tag).toContain(`aria-label="${name}"`);
    expect(icon.tag).toContain(`--icon-light:url(/os-icons/${light})`);
    expect(icon.tag).toContain(`--icon-dark:url(/os-icons/${dark})`);

    expect(icon.classes).toContain('bg-(image:--icon-light)');
    expect(icon.classes).toContain('dark:bg-none');
    expect(icon.classes).toContain('dark:mask-(--icon-dark)');
    expect(icon.classes).not.toContain('hidden');
  });

  it('falls back to the Monitor glyph for unknown operating systems', () => {
    const tags = renderTags('TempleOS');
    expect(tags).toHaveLength(1);
    expect(tags[0].element).toBe('svg');
    expect(tags[0].classes).toContain('lucide-monitor');
  });
});

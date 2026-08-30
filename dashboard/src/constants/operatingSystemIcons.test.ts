import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { OS_ICONS, resolveOSIcon, type OSDef } from './operatingSystemIcons';

describe('resolveOSIcon', () => {
  it('normalizes casing and spaces', () => {
    expect(resolveOSIcon('Windows 11')?.label).toBe('Windows 11');
    expect(resolveOSIcon('mac os')?.label).toBe('macOS');
  });

  it('uses one mono windows file for both themes', () => {
    const def = resolveOSIcon('Windows');
    expect(def?.icon).toEqual({ file: 'windows.svg', source: 'mdi/microsoft-windows', mono: true });
    expect(def?.iconDark).toBeUndefined();
  });

  it('gives macos a colored light icon and a mono dark icon', () => {
    const def = resolveOSIcon('macOS');
    expect(def?.icon).toEqual({ file: 'apple.svg', source: 'logos/apple' });
    expect(def?.iconDark).toEqual({ file: 'apple-dark.svg', source: 'simple-icons/apple', mono: true });
  });

  it('gives linux a colored light icon and a mono dark icon', () => {
    const def = resolveOSIcon('Linux');
    expect(def?.icon).toEqual({ file: 'linux.svg', source: 'logos/linux-tux' });
    expect(def?.iconDark).toEqual({ file: 'linux-dark.svg', source: 'simple-icons/linux', mono: true });
  });

  it('returns null for unknown os names', () => {
    expect(resolveOSIcon('TempleOS')).toBeNull();
  });

  it('has a committed SVG whose artwork matches the mono flag for every entry', () => {
    for (const def of Object.values<OSDef>(OS_ICONS)) {
      const svg = readFileSync(path.join('public', 'os-icons', def.icon.file), 'utf8');
      expect(svg.includes('currentColor')).toBe(Boolean(def.icon.mono));

      if (def.iconDark) {
        const svgDark = readFileSync(path.join('public', 'os-icons', def.iconDark.file), 'utf8');
        expect(svgDark.includes('currentColor')).toBe(Boolean(def.iconDark.mono));
      }
    }
  });
});

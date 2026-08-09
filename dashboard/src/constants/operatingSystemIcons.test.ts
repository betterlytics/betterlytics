import { describe, expect, it } from 'vitest';
import { resolveOSIcon } from './operatingSystemIcons';

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
});

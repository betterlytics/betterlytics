import { describe, expect, it } from 'vitest';
import { nextTabIndex } from '@/landing/lib/rovingTabs';

describe('nextTabIndex', () => {
  it('steps with the arrows and wraps round at the ends', () => {
    expect(nextTabIndex('ArrowRight', 0, 3)).toBe(1);
    expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0);
    expect(nextTabIndex('ArrowLeft', 1, 3)).toBe(0);
    expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2);
  });

  it('jumps to the ends with Home and End', () => {
    expect(nextTabIndex('Home', 2, 3)).toBe(0);
    expect(nextTabIndex('End', 0, 3)).toBe(2);
  });

  it('steps with up and down in a vertical list', () => {
    expect(nextTabIndex('ArrowDown', 2, 3, 'vertical')).toBe(0);
    expect(nextTabIndex('ArrowUp', 0, 3, 'vertical')).toBe(2);
    expect(nextTabIndex('ArrowRight', 0, 3, 'vertical')).toBeNull();
  });

  it('ignores every other key', () => {
    expect(nextTabIndex('Enter', 1, 3)).toBeNull();
    expect(nextTabIndex('ArrowDown', 1, 3)).toBeNull();
  });
});

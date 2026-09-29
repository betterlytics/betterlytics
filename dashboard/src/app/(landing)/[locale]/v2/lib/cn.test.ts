import { describe, expect, it } from 'vitest';
import { cn } from '@/landing/lib/cn';

describe('landing cn', () => {
  it('keeps a type token alongside a colour token', () => {
    expect(cn('text-display-1 text-muted')).toBe('text-display-1 text-muted');
    expect(cn('text-label text-fg')).toBe('text-label text-fg');
  });

  it('lets a later token of the same kind win', () => {
    expect(cn('text-body-sm text-caption')).toBe('text-caption');
    expect(cn('text-muted text-fg')).toBe('text-fg');
    expect(cn('border-rule border-rule-22')).toBe('border-rule-22');
    expect(cn('bg-fg/7 bg-canvas')).toBe('bg-canvas');
    expect(cn('tracking-ui tracking-tight')).toBe('tracking-tight');
    expect(cn('ease-out-expo ease-pen')).toBe('ease-pen');
  });

  it('knows the custom breakpoints', () => {
    expect(cn('max-3xl:px-2 max-3xl:px-4')).toBe('max-3xl:px-4');
  });
});

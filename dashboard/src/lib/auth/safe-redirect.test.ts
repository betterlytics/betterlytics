import { describe, it, expect } from 'vitest';
import { toSafeRelativePath } from '@/lib/auth/safe-redirect';

describe('toSafeRelativePath', () => {
  it('keeps same-origin absolute paths, including query and hash', () => {
    expect(toSafeRelativePath('/accept-invite/abc', '/dashboards')).toBe('/accept-invite/abc');
    expect(toSafeRelativePath('/dashboard/1?tab=x#top', '/dashboards')).toBe('/dashboard/1?tab=x#top');
  });

  it.each([
    ['absolute URL', 'https://evil.example/x'],
    ['protocol-relative', '//evil.example/x'],
    ['protocol-relative after a dot segment', '/.//evil.example/x'],
    ['protocol-relative after a parent segment', '/..//evil.example/x'],
    ['protocol-relative after a resolved parent segment', '/a/..//evil.example/x'],
    ['protocol-relative after an encoded dot segment', '/%2e//evil.example/x'],
    ['protocol-relative after an uppercase encoded dot segment', '/%2E//evil.example/x'],
    ['protocol-relative after an encoded parent segment', '/%2e%2e//evil.example/x'],
    ['backslash host', '/\\evil.example'],
    ['tab-split host', '/\t/evil.example'],
    ['newline-split host', '/\n/evil.example'],
    ['carriage-return-split host', '/\r/evil.example'],
    ['leading space', ' /dashboards'],
    ['scheme', 'javascript:alert(1)'],
    ['relative path', 'dashboards'],
    ['empty', ''],
    ['null', null],
    ['undefined', undefined],
    ['repeated query key (array)', ['/dashboards', '/other']],
    ['number', 42],
    ['object', { toString: () => '/dashboards' }],
  ])('falls back for %s', (_label, value) => {
    expect(toSafeRelativePath(value, '/dashboards')).toBe('/dashboards');
  });

  it('normalizes encoded slashes so the result cannot become protocol-relative', () => {
    expect(toSafeRelativePath('/%2F%2Fevil.example', '/dashboards')).toBe('/%2F%2Fevil.example');
  });

  it('keeps dot segments that normalize to a same-origin path', () => {
    expect(toSafeRelativePath('/dashboard/./1/../2?x=1', '/dashboards')).toBe('/dashboard/2?x=1');
  });
});

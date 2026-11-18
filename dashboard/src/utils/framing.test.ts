import { describe, expect, it } from 'vitest';
import { allowsFraming } from './framing';

const dashboard = 'https://betterlytics.io';

describe('allowsFraming', () => {
  it('allows a page without framing headers', () => {
    expect(allowsFraming({}, dashboard)).toBe(true);
  });

  it('blocks any X-Frame-Options value', () => {
    expect(allowsFraming({ 'x-frame-options': 'DENY' }, dashboard)).toBe(false);
    expect(allowsFraming({ 'x-frame-options': 'SAMEORIGIN' }, dashboard)).toBe(false);
  });

  it('lets frame-ancestors decide over X-Frame-Options', () => {
    expect(
      allowsFraming(
        { 'x-frame-options': 'SAMEORIGIN', 'content-security-policy': "frame-ancestors 'self' https://betterlytics.io" },
        dashboard,
      ),
    ).toBe(true);
    expect(allowsFraming({ 'content-security-policy': "default-src 'self'; frame-ancestors 'self'" }, dashboard)).toBe(
      false,
    );
    expect(allowsFraming({ 'content-security-policy': "frame-ancestors 'none'" }, dashboard)).toBe(false);
  });

  it('matches wildcards, schemes and ports in frame-ancestors', () => {
    expect(allowsFraming({ 'content-security-policy': 'frame-ancestors *' }, dashboard)).toBe(true);
    expect(allowsFraming({ 'content-security-policy': 'frame-ancestors https:' }, dashboard)).toBe(true);
    expect(allowsFraming({ 'content-security-policy': 'frame-ancestors *.betterlytics.io' }, dashboard)).toBe(false);
    expect(
      allowsFraming({ 'content-security-policy': 'frame-ancestors *.betterlytics.io' }, 'https://app.betterlytics.io'),
    ).toBe(true);
    expect(
      allowsFraming({ 'content-security-policy': 'frame-ancestors http://localhost:3140' }, 'http://localhost:3140'),
    ).toBe(true);
    expect(allowsFraming({ 'content-security-policy': 'frame-ancestors https://example.com' }, dashboard)).toBe(false);
  });

  it('requires every policy with frame-ancestors to allow it', () => {
    expect(
      allowsFraming({ 'content-security-policy': "frame-ancestors *, frame-ancestors 'self'" }, dashboard),
    ).toBe(false);
  });
});

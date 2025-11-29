import { describe, it, expect } from 'vitest';
import { generateSessionToken } from './session.service';

describe('generateSessionToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateSessionToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSessionToken());
    }
    expect(tokens.size).toBe(100);
  });
});

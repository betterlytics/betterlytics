import { describe, it, expect } from 'vitest';
import { maskEmail } from '@/utils/maskEmail';

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('jane.doe@acme.com')).toBe('j•••@acme.com');
  });

  it("doesn't give away the name's length", () => {
    expect(maskEmail('a@acme.com')).toBe('a•••@acme.com');
    expect(maskEmail('abcdefghij@acme.com')).toBe('a•••@acme.com');
  });

  it('masks everything when there is no name or no @', () => {
    expect(maskEmail('@acme.com')).toBe('•••');
    expect(maskEmail('not-an-email')).toBe('•••');
  });
});

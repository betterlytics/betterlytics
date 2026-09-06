import { describe, expect, it } from 'vitest';
import { domainValidation } from './dashboard.entities';

describe('domainValidation', () => {
  it.each([
    'example.com',
    'https://example.com/',
    'https://www.example.com/some/page',
    'sub.example.co.uk',
    'my-site.io',
  ])('accepts %s', (input) => {
    const result = domainValidation.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('returns the normalized hostname', () => {
    expect(domainValidation.parse('https://www.Example.com/dashboard/')).toBe('example.com');
  });

  it.each([
    ['', 'Domain is required'],
    ['   ', 'Domain must include an extension (e.g., example.com)'],
    ['localhost', 'Domain must include an extension (e.g., example.com)'],
    ['https://', 'Domain must include an extension (e.g., example.com)'],
    ['-example.com', 'Please enter a valid domain format'],
    ['example-.com', 'Please enter a valid domain format'],
    ['exa mple.com', 'Please enter a valid domain format'],
    ['example..com', 'Please enter a valid domain format'],
    ['ex@mple.com', 'Please enter a valid domain format'],
  ])('rejects %j with the existing message', (input, message) => {
    const result = domainValidation.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe(message);
    }
  });
});

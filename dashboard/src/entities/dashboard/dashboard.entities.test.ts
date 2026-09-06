import { describe, expect, it } from 'vitest';
import { domainValidation, normalizeDomainInput } from './dashboard.entities';

describe('normalizeDomainInput', () => {
  it.each([
    ['example.com', 'example.com', 'bare domain is untouched'],
    ['  example.com  ', 'example.com', 'surrounding whitespace'],
    ['https://example.com', 'example.com', 'protocol'],
    ['HTTPS://WWW.Example.COM', 'example.com', 'uppercase protocol, www and host'],
    ['www.example.com', 'example.com', 'www prefix'],
    ['example.com/', 'example.com', 'trailing slash'],
    ['https://example.com/', 'example.com', 'protocol and trailing slash'],
    ['https://example.com/some/page?utm=1#top', 'example.com', 'full url with path, query and fragment'],
    ['example.com?ref=x', 'example.com', 'query without path'],
    ['example.com:3000', 'example.com', 'port'],
    ['example.com.', 'example.com', 'trailing dot'],
    ['https://blog.example.co.uk/posts', 'blog.example.co.uk', 'subdomain is kept'],
  ])('%s → %s (%s)', (input, expected) => {
    expect(normalizeDomainInput(input)).toBe(expected);
  });
});

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

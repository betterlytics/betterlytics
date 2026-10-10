import { describe, it, expect } from 'vitest';
import { emailSenderEnvIssue, parseSenderAddress } from '@/lib/env/email-sender';

describe('parseSenderAddress', () => {
  it('parses a bare address', () => {
    expect(parseSenderAddress('a@b.co')).toEqual({ email: 'a@b.co' });
  });

  it('parses a display name', () => {
    expect(parseSenderAddress('Acme <a@b.co>')).toEqual({ email: 'a@b.co', name: 'Acme' });
  });

  it('strips quotes around a display name', () => {
    expect(parseSenderAddress('"Acme, Inc" <a@b.co>')).toEqual({ email: 'a@b.co', name: 'Acme, Inc' });
  });

  it('gives no name for an angle-bracketed address alone', () => {
    expect(parseSenderAddress('<a@b.co>')).toEqual({ email: 'a@b.co' });
  });

  it('treats empty, whitespace and missing as undefined', () => {
    expect(parseSenderAddress('')).toBeUndefined();
    expect(parseSenderAddress('   ')).toBeUndefined();
    expect(parseSenderAddress(undefined)).toBeUndefined();
  });
});

describe('emailSenderEnvIssue', () => {
  const selfhost = { ENABLE_EMAILS: true, IS_CLOUD: false };

  it('requires SMTP_FROM off-cloud with emails on', () => {
    for (const SMTP_FROM of [undefined, '  ']) {
      const issue = emailSenderEnvIssue({ ...selfhost, SMTP_FROM });
      expect(issue).toContain('SMTP_FROM');
      expect(issue).toContain('MailerSend');
    }
  });

  it('rejects a malformed SMTP_FROM', () => {
    expect(emailSenderEnvIssue({ ...selfhost, SMTP_FROM: 'not-an-address' })).toContain(
      'SMTP_FROM must be an email address',
    );
  });

  it('ignores the sender when emails are off or on Cloud', () => {
    expect(emailSenderEnvIssue({ ENABLE_EMAILS: false, IS_CLOUD: false })).toBeNull();
    expect(emailSenderEnvIssue({ ENABLE_EMAILS: true, IS_CLOUD: true })).toBeNull();
  });

  it('accepts an address with a display name', () => {
    expect(emailSenderEnvIssue({ ...selfhost, SMTP_FROM: 'Acme <a@b.co>' })).toBeNull();
  });
});

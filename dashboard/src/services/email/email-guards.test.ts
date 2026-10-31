import { describe, expect, it } from 'vitest';
import { emailSkipReason, type EmailGuardContext } from '@/services/email/email-guards';
import { EMAIL_TYPES, type EmailType } from '@/services/email/email-types';

const prodCloud: EmailGuardContext = { enableEmails: true, isCloud: true, isDevelopment: false };
const selfHost: EmailGuardContext = { enableEmails: true, isCloud: false, isDevelopment: false };
const dev: EmailGuardContext = { enableEmails: true, isCloud: true, isDevelopment: true };

const deletedRecipient = 'deleted_cm1abc2def3@deleted.invalid';

describe('emailSkipReason', () => {
  it('sends to a regular recipient in production', () => {
    expect(emailSkipReason('usage-alert', { to: 'owner@example.com' }, prodCloud)).toBeNull();
  });

  it('skips every email type addressed to a deleted account', () => {
    for (const type of Object.keys(EMAIL_TYPES) as EmailType[]) {
      const ctx = EMAIL_TYPES[type].saasOnly ? prodCloud : selfHost;
      expect(emailSkipReason(type, { to: deletedRecipient }, ctx)).toBe(
        `deleted account recipient '${deletedRecipient}'`,
      );
    }
  });

  it('matches the deleted account domain case-insensitively and after trimming', () => {
    const to = '  Deleted_X@DELETED.Invalid ';
    expect(emailSkipReason('usage-alert', { to }, prodCloud)).toBe(`deleted account recipient '${to}'`);
  });

  it('does not treat lookalike domains as deleted accounts', () => {
    expect(emailSkipReason('usage-alert', { to: 'user@notdeleted.invalid' }, prodCloud)).toBeNull();
    expect(emailSkipReason('usage-alert', { to: 'user@deleted.invalid.example.com' }, prodCloud)).toBeNull();
  });

  it('skips deleted account recipients in development too', () => {
    expect(emailSkipReason('usage-alert', { to: deletedRecipient }, dev)).toBe(
      `deleted account recipient '${deletedRecipient}'`,
    );
  });

  it('keeps the existing guards', () => {
    expect(
      emailSkipReason('usage-alert', { to: 'owner@example.com' }, { ...prodCloud, enableEmails: false }),
    ).toBe('ENABLE_EMAILS=false');
    expect(emailSkipReason('usage-alert', { to: 'owner@example.com' }, selfHost)).toBe(
      "'usage-alert' is saasOnly",
    );
    expect(emailSkipReason('usage-alert', { to: 'owner@example.com' }, dev)).toBe(
      "dev guard: non-@betterlytics.io recipient 'owner@example.com'",
    );
    expect(emailSkipReason('usage-alert', { to: 'dev@betterlytics.io' }, dev)).toBeNull();
  });
});

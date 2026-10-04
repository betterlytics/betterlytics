import { describe, expect, it } from 'vitest';
import { EMAIL_TYPES, renderEmail, senderFor, validateSendEmailPayload } from '@/services/email/email-types';
import { createEmailRecipientKey } from '@/services/email/recipient-key.service';

const monitorBase = {
  to: 'owner@example.com',
  monitorName: 'example.com',
  url: 'https://example.com',
  dashboardId: 'dash-1',
  monitorId: 'check-1',
};

function envelope(type: string, data: object) {
  return { type, recipientKey: 'email:abc', campaignKey: 'campaign', data };
}

describe('validateSendEmailPayload', () => {
  it('accepts a well-formed monitor-down payload and strips nothing the template needs', () => {
    const result = validateSendEmailPayload(
      envelope('monitor-down', {
        ...monitorBase,
        reason: 'Connection timed out',
        statusCode: 503,
        detectedAt: '2026-01-15T10:30:00+00:00',
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.type).toBe('monitor-down');
    expect(result.payload.data).toMatchObject({ reason: 'Connection timed out', statusCode: 503 });
  });

  it('is permissive about values the template can tolerate (a rejected payload is a lost alert)', () => {
    const result = validateSendEmailPayload(
      envelope('monitor-down', {
        ...monitorBase,
        monitorName: '',
        reason: '',
        statusCode: 999,
        detectedAt: '2026-01-15T10:30:00.123456789+00:00',
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('accepts recovery and ssl payloads with their optional fields omitted', () => {
    expect(
      validateSendEmailPayload(
        envelope('monitor-recovery', { ...monitorBase, recoveredAt: '2026-01-15T11:02:00Z' }),
      ).ok,
    ).toBe(true);
    expect(
      validateSendEmailPayload(envelope('monitor-ssl', { ...monitorBase, expired: true, daysLeft: -1 })).ok,
    ).toBe(true);
  });

  it('rejects a monitor payload that breaks the Rust contract', () => {
    const result = validateSendEmailPayload(
      envelope('monitor-down', { ...monitorBase, reason: 'x', detectedAt: 'not-a-date' }),
    );
    expect(result).toMatchObject({ ok: false, type: 'monitor-down' });
  });

  it('rejects unknown types and malformed envelopes without throwing', () => {
    // Unknown types are reported as 'unknown' so the metric label stays bounded.
    expect(validateSendEmailPayload(envelope('not-a-type', { to: 'a@b.c' }))).toMatchObject({
      ok: false,
      type: 'unknown',
    });
    expect(validateSendEmailPayload(null)).toMatchObject({ ok: false, type: 'unknown' });
    expect(validateSendEmailPayload({ type: 'reset-password' })).toMatchObject({
      ok: false,
      type: 'reset-password',
    });
  });

  it('only validates the envelope for types without a schema', () => {
    const result = validateSendEmailPayload(envelope('reset-password', { to: 'a@b.c', anything: 1 }));
    expect(result.ok).toBe(true);
  });

  it('every type with a schema is self-hostable (alerts must work over SMTP)', () => {
    for (const [type, def] of Object.entries(EMAIL_TYPES)) {
      if ('schema' in def) expect(def.saasOnly, type).toBe(false);
    }
  });
});

describe('senderFor', () => {
  it('applies the alert sender on cloud and keeps SMTP_FROM authoritative off-cloud', () => {
    expect(senderFor('monitor-down', true)).toEqual({
      name: 'Betterlytics Alerts',
      email: 'alerts@betterlytics.io',
    });
    expect(senderFor('monitor-down', false)).toEqual({ name: 'Betterlytics Alerts', email: undefined });
  });

  it('is undefined for types without a sender override', () => {
    expect(senderFor('reset-password', true)).toBeUndefined();
  });
});

describe('recipient key', () => {
  it('matches the Rust derivation fixture in backend/src/jobqueue/mod.rs', () => {
    expect(createEmailRecipientKey('  Owner@Example.com ')).toBe(
      'email:c8cd3c6427301eaf6665bccacd65ddb614527acc843a15463e3faba57124c351',
    );
  });
});

describe('monitor alert templates', () => {
  it('renders subjects with sanitized monitor names and the key details in the body', async () => {
    const down = await renderEmail({
      type: 'monitor-down',
      recipientKey: 'k',
      campaignKey: 'c',
      data: {
        ...monitorBase,
        monitorName: 'bad\nname' + 'x'.repeat(100),
        reason: 'Connection timed out',
        detectedAt: '2026-01-15T10:30:00+00:00',
      },
    });
    expect(down.subject).toBe(`Uptime Alert: Site Is Down: badname${'x'.repeat(53)}`);
    expect(down.html).toContain('Connection timed out');
    expect(down.html).toContain('2026-01-15 10:30:00 UTC');
    expect(down.html).toContain('/dashboard/dash-1/monitoring/check-1');
    expect(down.text).toContain('Connection timed out');

    const recovery = await renderEmail({
      type: 'monitor-recovery',
      recipientKey: 'k',
      campaignKey: 'c',
      data: { ...monitorBase, recoveredAt: '2026-01-15T11:02:00Z', downtimeSeconds: 1920 },
    });
    expect(recovery.subject).toBe('Resolved: Site Is Back Online: example.com');
    expect(recovery.html).toContain('32 minutes');

    const expiring = await renderEmail({
      type: 'monitor-ssl',
      recipientKey: 'k',
      campaignKey: 'c',
      data: { ...monitorBase, expired: false, daysLeft: 7, expiresAt: '2026-01-22T00:00:00Z' },
    });
    expect(expiring.subject).toBe('SSL Certificate Expiring Soon: example.com');
    expect(expiring.html).toContain('7 days remaining');

    const expired = await renderEmail({
      type: 'monitor-ssl',
      recipientKey: 'k',
      campaignKey: 'c',
      data: { ...monitorBase, expired: true, daysLeft: -3 },
    });
    expect(expired.subject).toBe('SSL Certificate Expired: example.com');
    expect(expired.html).toContain('Certificate has expired!');
  });
});

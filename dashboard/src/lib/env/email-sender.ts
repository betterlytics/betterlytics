import { z } from 'zod';

export type SenderAddress = { email: string; name?: string };

const NAME_ADDR = /^(.*?)\s*<\s*([^<>\s]+)\s*>$/;
const EmailSchema = z.string().email();

/** Parses `addr`, `Name <addr>` or `"Name" <addr>`. Never validates the address itself. */
export function parseSenderAddress(raw: string | undefined): SenderAddress | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  const match = NAME_ADDR.exec(value);
  if (!match) return { email: value };
  const name = match[1]
    .trim()
    .replace(/^"(.*)"$/, '$1')
    .trim();
  return name ? { email: match[2], name } : { email: match[2] };
}

export function emailSenderEnvIssue(env: {
  ENABLE_EMAILS: boolean;
  IS_CLOUD: boolean;
  SMTP_FROM?: string;
}): string | null {
  if (!env.ENABLE_EMAILS || env.IS_CLOUD) return null;
  const sender = parseSenderAddress(env.SMTP_FROM);
  if (!sender) {
    // No trailing period: parseEnv appends ". Check the environment passed to the dashboard."
    return (
      'ENABLE_EMAILS=true requires SMTP_FROM on self-hosted instances. It is the sender address for all email, ' +
      'MailerSend and SMTP alike, and must be on a domain your email provider has verified, e.g. ' +
      'SMTP_FROM="Analytics <analytics@example.com>". Set ENABLE_EMAILS=false to run without email'
    );
  }
  if (!EmailSchema.safeParse(sender.email).success) {
    return `SMTP_FROM must be an email address, optionally with a display name ("Analytics <analytics@example.com>"), got "${env.SMTP_FROM}"`;
  }
  return null;
}

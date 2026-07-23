import type { PublicIncidentCause } from '@/entities/analytics/statusPage/publicStatusPage.entities';

export const REASON_CODE_KEYS = [
  'ok',
  'tls_handshake_failed',
  'tls_missing_certificate',
  'tls_expired',
  'tls_expiring_soon',
  'tls_parse_error',
  'tls_hostname_mismatch',
  'tls_untrusted_ca',
  'tls_not_yet_valid',
  'tls_revoked',
  'tls_self_signed',
  'tls_connection_failed',
  'http_4xx',
  'http_5xx',
  'http_other',
  'http_timeout',
  'http_connect_error',
  'http_body_error',
  'http_request_error',
  'http_error',
  'too_many_redirects',
  'redirect_join_failed',
  'scheme_blocked',
  'port_blocked',
  'invalid_host',
  'blocked_ip_literal',
  'dns_blocked',
  'dns_error',
  'keyword_not_found',
  'unknown',
] as const;

export type ReasonCodeKey = (typeof REASON_CODE_KEYS)[number];

export const reasonCodeFallbackMessages: Record<ReasonCodeKey, string> = {
  ok: 'Site is healthy',
  tls_handshake_failed: 'SSL/TLS handshake failed',
  tls_missing_certificate: 'SSL certificate not found',
  tls_expired: 'SSL certificate has expired',
  tls_expiring_soon: 'SSL certificate expiring soon',
  tls_parse_error: 'Failed to parse SSL certificate',
  tls_hostname_mismatch: 'SSL certificate hostname mismatch',
  tls_untrusted_ca: 'SSL certificate issued by untrusted CA',
  tls_not_yet_valid: 'SSL certificate not yet valid',
  tls_revoked: 'SSL certificate has been revoked',
  tls_self_signed: 'SSL certificate is self-signed',
  tls_connection_failed: 'SSL connection failed',
  http_4xx: 'Server returned a client error',
  http_5xx: 'Server returned a server error',
  http_other: 'Unexpected HTTP status code',
  http_timeout: 'Request timed out',
  http_connect_error: 'Could not connect to server',
  http_body_error: 'Error reading response body',
  http_request_error: 'Error sending request',
  http_error: 'HTTP request failed',
  too_many_redirects: 'Too many redirects',
  redirect_join_failed: 'Invalid redirect location',
  scheme_blocked: 'URL scheme not allowed',
  port_blocked: 'Port not allowed',
  invalid_host: 'Invalid hostname',
  blocked_ip_literal: 'IP address not allowed',
  dns_blocked: 'DNS resolved to blocked address',
  dns_error: 'DNS resolution failed',
  keyword_not_found: 'Expected keyword not found in response',
  unknown: 'Unknown error',
};

/**
 * Returns the translation key suffix for a given reason code.
 * Use with `useTranslations('monitor.reason')` to get the translated message.
 * Falls back to 'unknown' if the code is unknown, and logs a warning.
 */
export function getReasonTranslationKey(reasonCode: string | null | undefined): ReasonCodeKey {
  if (!reasonCode) {
    return 'unknown';
  }

  if (reasonCode in reasonCodeFallbackMessages) {
    return reasonCode as ReasonCodeKey;
  }

  console.warn(`[Monitor] Missing translation key for reason code: ${reasonCode}`);
  return 'unknown';
}

const REASON_CODE_TO_PUBLIC_CAUSE: Partial<Record<ReasonCodeKey, PublicIncidentCause>> = {
  http_5xx: 'serverError',
  http_4xx: 'clientError',
  http_timeout: 'timeout',
  tls_handshake_failed: 'ssl',
  tls_missing_certificate: 'ssl',
  tls_expired: 'ssl',
  tls_expiring_soon: 'ssl',
  tls_parse_error: 'ssl',
  tls_hostname_mismatch: 'ssl',
  tls_untrusted_ca: 'ssl',
  tls_not_yet_valid: 'ssl',
  tls_revoked: 'ssl',
  tls_self_signed: 'ssl',
  tls_connection_failed: 'ssl',
  http_connect_error: 'network',
  http_request_error: 'network',
  dns_error: 'network',
};

export function getPublicIncidentCause(reasonCode: string | null | undefined): PublicIncidentCause {
  if (reasonCode && reasonCode in REASON_CODE_TO_PUBLIC_CAUSE) {
    return REASON_CODE_TO_PUBLIC_CAUSE[reasonCode as ReasonCodeKey] ?? 'disruption';
  }
  return 'disruption';
}

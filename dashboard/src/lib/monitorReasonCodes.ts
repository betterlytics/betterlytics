export const REASON_CODE_KEYS = [
  'ok',
  'tls_handshake_failed',
  'tls_missing_certificate',
  'tls_expired',
  'tls_expiring_soon',
  'tls_parse_error',
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

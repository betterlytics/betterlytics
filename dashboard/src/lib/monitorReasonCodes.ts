export const reasonCodeToTranslationKey: Record<string, string> = {
  ok: 'monitor.reason.ok',
  tls_handshake_failed: 'monitor.reason.tls_handshake_failed',
  tls_missing_certificate: 'monitor.reason.tls_missing_certificate',
  tls_expired: 'monitor.reason.tls_expired',
  tls_expiring_soon: 'monitor.reason.tls_expiring_soon',
  tls_parse_error: 'monitor.reason.tls_parse_error',
  http_4xx: 'monitor.reason.http_4xx',
  http_5xx: 'monitor.reason.http_5xx',
  http_other: 'monitor.reason.http_other',
  http_timeout: 'monitor.reason.http_timeout',
  http_connect_error: 'monitor.reason.http_connect_error',
  http_body_error: 'monitor.reason.http_body_error',
  http_request_error: 'monitor.reason.http_request_error',
  http_error: 'monitor.reason.http_error',
  too_many_redirects: 'monitor.reason.too_many_redirects',
  redirect_join_failed: 'monitor.reason.redirect_join_failed',
  scheme_blocked: 'monitor.reason.scheme_blocked',
  port_blocked: 'monitor.reason.port_blocked',
  invalid_host: 'monitor.reason.invalid_host',
  blocked_ip_literal: 'monitor.reason.blocked_ip_literal',
  dns_blocked: 'monitor.reason.dns_blocked',
  dns_error: 'monitor.reason.dns_error',
};

export const reasonCodeFallbackMessages: Record<string, string> = {
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
};

/**
 * Returns a human-readable message for a given reason code.
 * Falls back to a default message if the code is unknown, and logs a warning.
 */
export function getReasonMessage(reasonCode: string | null | undefined): string {
  if (!reasonCode) {
    return 'Unknown reason';
  }

  const message = reasonCodeFallbackMessages[reasonCode];

  if (!message) {
    console.warn(`[Monitor] Missing mapping for reason code: ${reasonCode}`);
    return `Unknown error (${reasonCode})`;
  }

  return message;
}

/**
 * `jane.doe@acme.com` → `j•••@acme.com`: enough for the owner to tell which of their addresses it is (the domain
 * usually says work or personal), not enough to hand someone else the address. The dots are a fixed run, so the
 * name's length isn't given away either.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '•••';
  return `${email[0]}•••${email.slice(at)}`;
}

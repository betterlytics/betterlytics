import { randomBytes } from 'crypto';

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

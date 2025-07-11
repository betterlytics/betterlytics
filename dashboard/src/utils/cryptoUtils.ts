import * as crypto from 'crypto';

export function generateSecureTokenNoSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

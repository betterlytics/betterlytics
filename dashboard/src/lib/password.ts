import 'server-only';

import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

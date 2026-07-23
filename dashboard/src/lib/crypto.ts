import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const INPUT_ENCODING = 'utf8';
const OUTPUT_ENCODING = 'hex';
const IV_LENGTH = 12;

export function symmetricEncrypt(text: string, key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const keyBuffer = Buffer.from(key, 'utf8');
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const encrypted = cipher.update(text, INPUT_ENCODING, OUTPUT_ENCODING) + cipher.final(OUTPUT_ENCODING);
  const authTag = cipher.getAuthTag().toString(OUTPUT_ENCODING);

  return `${iv.toString(OUTPUT_ENCODING)}$${encrypted}$${authTag}`;
}

export function symmetricDecrypt(data: string, key: string): string {
  const [ivHex, encrypted, authTagHex] = data.split('$');

  const iv = Buffer.from(ivHex, OUTPUT_ENCODING);
  const authTag = Buffer.from(authTagHex, OUTPUT_ENCODING);
  const keyBuffer = Buffer.from(key, 'utf8');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  const decrypted = decipher.update(encrypted, OUTPUT_ENCODING, INPUT_ENCODING) + decipher.final(INPUT_ENCODING);
  return decrypted;
}

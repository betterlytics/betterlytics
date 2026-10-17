import { describe, it, expect } from 'vitest';
import { PASSWORD_RULES, PasswordSchema } from '@/entities/auth/password.entities';

const meetsAllRules = (password: string) => Object.values(PASSWORD_RULES).every((rule) => rule(password));

// The checklist shows PASSWORD_RULES; the server enforces PasswordSchema. They must never disagree.
describe('PASSWORD_RULES and PasswordSchema', () => {
  it.each([
    ['Abcdefgh', true, 'valid at minimum length'],
    ['Abcdefg1!', true, 'digits and symbols allowed'],
    ['Ab' + 'c'.repeat(98), true, 'exactly 100 chars'],
    ['', false, 'empty'],
    ['Abcdefg', false, 'too short (7 chars)'],
    ['Ab' + 'c'.repeat(99), false, 'too long (101 chars)'],
    ['ABCDEFGH', false, 'no lowercase letter'],
    ['abcdefgh', false, 'no uppercase letter'],
    ['12345678', false, 'no letters'],
    ['ÆØÅæøåxx', false, 'no ASCII uppercase letter'],
  ])('%s → valid: %s (%s)', (password, valid) => {
    expect(PasswordSchema.safeParse(password).success).toBe(valid);
    expect(meetsAllRules(password)).toBe(valid);
  });
});

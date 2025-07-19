'server-only';

import { symmetricDecrypt, symmetricEncrypt } from '@/lib/crypto';
import { env } from '@/lib/env';
import * as UsersRepository from '@/repositories/postgres/user';
import * as OTPAuth from 'otpauth';

export async function setupTotp(userId: string): Promise<string> {
  try {
    const user = await UsersRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.totpEnabled) {
      throw new Error('Totp already enabled');
    }

    const totpSecret = new OTPAuth.Secret().base32;
    const encryptedTotpSecret = symmetricEncrypt(totpSecret, env.TOTP_SECRET_ENCRYPTION_KEY);

    await UsersRepository.updateUser(userId, {
      totpSecret: encryptedTotpSecret,
    });

    const totp = new OTPAuth.TOTP({
      issuer: 'Betterlytics',
      label: user.email,
      secret: totpSecret,
    });

    const keyUrl = totp.toString();
    return keyUrl;
  } catch (error) {
    console.error('Error setting up totp:', error);
    throw new Error('Failed to setup totp');
  }
}

export async function enableTotp(userId: string, totp: string): Promise<void> {
  try {
    const user = await UsersRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.totpEnabled) {
      throw new Error('Totp already enabled');
    }

    if (!user.totpSecret) {
      throw new Error('Totp not set up');
    }

    const validTotp = isValidTotp(totp, user.totpSecret);
    if (!validTotp) {
      throw new Error('Totp is invalid');
    }

    await UsersRepository.updateUser(userId, {
      totpEnabled: true,
    });
  } catch (error) {
    console.error('Error enabling up totp:', error);
    throw new Error('Failed to enable totp');
  }
}

export function isValidTotp(totp: string, secret: string): boolean {
  const decryptedTotpSecret = symmetricDecrypt(secret, env.TOTP_SECRET_ENCRYPTION_KEY);
  const totpSecret = OTPAuth.Secret.fromBase32(decryptedTotpSecret);
  const validTotp = OTPAuth.TOTP.validate({ token: totp, secret: totpSecret });
  return validTotp !== null;
}

export async function disableTotp(userId: string): Promise<void> {
  try {
    const user = await UsersRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.totpEnabled) {
      throw new Error('Totp already disabled');
    }

    await UsersRepository.updateUser(userId, {
      totpEnabled: false,
      totpSecret: null,
    });
  } catch (error) {
    console.error('Error disabling up totp:', error);
    throw new Error('Failed to disable totp');
  }
}

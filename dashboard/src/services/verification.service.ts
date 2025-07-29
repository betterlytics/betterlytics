'server-only';

import {
  createVerificationToken,
  findVerificationToken,
  deleteVerificationToken,
  markUserEmailAsVerified,
  findVerificationTokenByIdentifier,
  deleteExpiredVerificationTokens,
} from '@/repositories/postgres/verification';
import { findUserByEmail } from '@/repositories/postgres/user';
import { sendEmailVerificationEmail } from '@/services/email/mail.service';
import { env } from '@/lib/env';
import {
  SendVerificationEmailData,
  SendVerificationEmailSchema,
  VerifyEmailData,
  VerifyEmailSchema,
  VerificationResult,
} from '@/entities/verification';
import { generateSecureTokenNoSalt } from '@/utils/cryptoUtils';
import { addMinutes, isBefore, subMinutes } from 'date-fns';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getDisplayName } from '@/utils/userUtils';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const RESEND_COOLDOWN_MINUTES = 5;

export async function sendVerificationEmail(data: SendVerificationEmailData): Promise<void> {
  if (!isFeatureEnabled('enableAccountVerification')) {
    console.warn('Account verification is disabled, skipping email send');
    return;
  }

  try {
    const validatedData = SendVerificationEmailSchema.parse(data);
    const { email } = validatedData;

    await deleteExpiredVerificationTokens();

    const user = await findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    const token = generateSecureTokenNoSalt();
    const expires = createExpiryDate();

    await createVerificationToken({
      identifier: email,
      token,
      expires,
    });

    const verificationUrl = `${env.PUBLIC_BASE_URL}/verify-email?token=${token}`;

    await sendEmailVerificationEmail({
      to: email,
      userName: getDisplayName(user.name, user.email),
      verificationToken: token,
      verificationUrl,
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function verifyEmail(data: VerifyEmailData): Promise<VerificationResult> {
  if (!isFeatureEnabled('enableAccountVerification')) {
    return {
      success: false,
      error: 'Account verification is not enabled',
    };
  }

  try {
    const validatedData = VerifyEmailSchema.parse(data);
    const { token } = validatedData;

    await deleteExpiredVerificationTokens();

    const verificationToken = await findVerificationToken(token);

    if (!verificationToken) {
      return {
        success: false,
        error: 'Invalid or expired verification token',
      };
    }

    if (verificationToken.expires < new Date()) {
      await deleteVerificationToken(token);
      return {
        success: false,
        error: 'Verification token has expired',
      };
    }

    const user = await findUserByEmail(verificationToken.identifier);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      await deleteVerificationToken(token);
      return {
        success: false,
        error: 'Email is already verified',
      };
    }

    await markUserEmailAsVerified(verificationToken.identifier);

    await deleteVerificationToken(token);

    return {
      success: true,
      email: verificationToken.identifier,
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      error: 'Failed to verify email',
    };
  }
}

function createExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);
  return expiryDate;
}

export async function checkRateLimit(email: string): Promise<{ allowed: boolean; nextAllowedAt?: Date }> {
  try {
    const now = new Date();
    const recentToken = await findVerificationTokenByIdentifier(email);

    if (!recentToken) {
      return { allowed: true };
    }

    const cooldownAgo = subMinutes(now, RESEND_COOLDOWN_MINUTES);

    if (isBefore(recentToken.createdAt, cooldownAgo)) {
      return { allowed: true };
    }

    const nextAllowedAt = addMinutes(recentToken.createdAt, RESEND_COOLDOWN_MINUTES);
    return { allowed: false, nextAllowedAt };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true };
  }
}

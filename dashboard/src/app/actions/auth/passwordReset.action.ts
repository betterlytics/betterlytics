'use server';

import {
  ForgotPasswordData,
  ForgotPasswordSchema,
  ResetPasswordData,
  ResetPasswordSchema,
} from '@/entities/auth/passwordReset';
import { initiatePasswordReset, resetPassword, validateResetToken } from '@/services/auth/passwordReset.service';

export async function forgotPasswordAction(formData: ForgotPasswordData) {
  try {
    const validatedData = ForgotPasswordSchema.parse(formData);
    return await initiatePasswordReset(validatedData);
  } catch (error) {
    console.error('Forgot password action error:', error);
    return false;
  }
}

export async function resetPasswordAction(formData: ResetPasswordData) {
  try {
    const validatedData = ResetPasswordSchema.parse(formData);
    return await resetPassword(validatedData);
  } catch (error) {
    console.error('Reset password action error:', error);
    return false;
  }
}

export async function validateResetTokenAction(token: string) {
  try {
    return await validateResetToken(token);
  } catch (error) {
    console.error('Validate reset token action error:', error);
    return false;
  }
}

import { z } from 'zod';
import { PasswordSchema } from './user.entities';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: PasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const PasswordResetTokenSchema = z.object({
  id: z.string(),
  token: z.string(),
  userId: z.string(),
  expires: z.date(),
  createdAt: z.date(),
});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;
export type PasswordResetToken = z.infer<typeof PasswordResetTokenSchema>;

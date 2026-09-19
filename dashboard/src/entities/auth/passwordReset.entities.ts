import { z } from 'zod';
import { PasswordSchema } from './password.entities';

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(254, 'Email address is too long'),
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

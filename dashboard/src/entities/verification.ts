import { z } from 'zod';

export const SendVerificationEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const VerificationTokenSchema = z.object({
  id: z.string(),
  identifier: z.string().email(),
  token: z.string(),
  expires: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateVerificationTokenSchema = z.object({
  identifier: z.string().email(),
  token: z.string().min(1),
  expires: z.date(),
});

export const VerificationResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  email: z.string().email().optional(),
});

export type SendVerificationEmailData = z.infer<typeof SendVerificationEmailSchema>;
export type VerifyEmailData = z.infer<typeof VerifyEmailSchema>;
export type VerificationToken = z.infer<typeof VerificationTokenSchema>;
export type CreateVerificationTokenData = z.infer<typeof CreateVerificationTokenSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

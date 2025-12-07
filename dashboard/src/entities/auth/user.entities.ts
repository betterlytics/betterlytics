import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { SUPPORTED_LANGUAGES, SupportedLanguages } from '@/constants/i18n';

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be no more than 100 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter');

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  passwordHash: z.string().nullable().optional(),
  role: z.nativeEnum(UserRole).nullable(),
  emailVerified: z.date().nullable().optional(),
  image: z.string().nullable().optional(),
  totpEnabled: z.boolean().default(false),
  totpSecret: z.string().nullable().optional(),
  termsAcceptedVersion: z.number().nullable().optional(),
  termsAcceptedAt: z.date().nullable().optional(),
  changelogVersionSeen: z.string().optional().default('v0'),
  onboardingCompletedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  passwordHash: z.string(),
  role: z.nativeEnum(UserRole).nullable().optional(),
  termsAcceptedVersion: z.number().nullable().optional(),
  termsAcceptedAt: z.date().nullable().optional(),
});

export const UpdateUserSchema = z.object({
  name: z.string().nullable().optional(),
  totpEnabled: z.boolean().optional(),
  totpSecret: z.string().nullable().optional(),
});

export const RegisterUserSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: PasswordSchema,
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'onboarding.account.termsOfServiceRequired' }),
  }),
  role: z.nativeEnum(UserRole).optional(),
  language: z.preprocess(
    (val) => (SUPPORTED_LANGUAGES.includes(val as SupportedLanguages) ? val : 'en'),
    z.enum(SUPPORTED_LANGUAGES).default('en'),
  ),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  totp: z.string().length(6).optional(),
});

export const AuthenticatedUserSchema = UserSchema.extend({
  dashboardId: z.string(),
  siteId: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type UpdateUserData = z.infer<typeof UpdateUserSchema>;
export type RegisterUserData = z.infer<typeof RegisterUserSchema>;
export type LoginUserData = z.infer<typeof LoginUserSchema>;
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

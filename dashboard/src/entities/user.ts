import { z } from 'zod';

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
  passwordHash: z.string().optional(),
  role: z.enum(['admin', 'user']).nullable(),
  emailVerified: z.date().nullable().optional(),
  image: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  passwordHash: z.string(),
  role: z.enum(['admin', 'user']).nullable().optional(),
});

export const RegisterUserSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: PasswordSchema,
  role: z.enum(['admin', 'user']).optional(),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AuthenticatedUserSchema = UserSchema.extend({
  dashboardId: z.string(),
  siteId: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserData = z.infer<typeof CreateUserSchema>;
export type RegisterUserData = z.infer<typeof RegisterUserSchema>;
export type LoginUserData = z.infer<typeof LoginUserSchema>;
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

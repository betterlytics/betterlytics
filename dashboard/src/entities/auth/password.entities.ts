import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;

/** The rules PasswordSchema enforces, for forms that tick them off as the password is typed. */
export const PASSWORD_RULES = {
  length: (password: string) => password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  lower: (password: string) => LOWERCASE.test(password),
  upper: (password: string) => UPPERCASE.test(password),
} as const;

export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'Password must be at least 8 characters long')
  .max(PASSWORD_MAX_LENGTH, 'Password must be no more than 100 characters long')
  .regex(LOWERCASE, 'Password must contain at least one lowercase letter')
  .regex(UPPERCASE, 'Password must contain at least one uppercase letter');

export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),
  newPassword: PasswordSchema,
  confirmPassword: z
    .string()
    .min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});


export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;

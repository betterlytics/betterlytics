import { z } from "zod";

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be no more than 100 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter');

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


export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});

export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
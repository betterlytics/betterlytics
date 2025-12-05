import { z } from "zod";

export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be less than 128 characters"),
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
  newPassword: z.string().min(8).max(128),
});

export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>; 
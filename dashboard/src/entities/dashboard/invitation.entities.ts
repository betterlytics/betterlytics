import { z } from 'zod';
import { DashboardRole } from '@prisma/client';

const InvitationStatusEnum = z.enum(['pending', 'accepted', 'declined', 'cancelled', 'expired']);

export const DashboardInvitationSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  email: z.string().email(),
  role: z.nativeEnum(DashboardRole),
  invitedById: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  status: InvitationStatusEnum.default('pending'),
  createdAt: z.date(),
});

export const CreateInvitationSchema = z.object({
  dashboardId: z.string(),
  email: z.string().email('Please enter a valid email address'),
  role: z.nativeEnum(DashboardRole).refine((role) => role !== 'owner', { message: 'Cannot invite as owner' }),
  invitedById: z.string(),
});

export const InvitationWithInviterSchema = DashboardInvitationSchema.extend({
  invitedBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
  }),
  dashboard: z
    .object({
      id: z.string(),
      domain: z.string(),
    })
    .optional(),
});

export const DashboardMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dashboardId: z.string(),
  role: z.nativeEnum(DashboardRole),
  createdAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
  }),
});

export type InvitationStatus = z.infer<typeof InvitationStatusEnum>;
export type DashboardInvitation = z.infer<typeof DashboardInvitationSchema>;
export type CreateInvitationData = z.infer<typeof CreateInvitationSchema>;
export type InvitationWithInviter = z.infer<typeof InvitationWithInviterSchema>;
export type DashboardMember = z.infer<typeof DashboardMemberSchema>;

'use server';

import { withDashboardMutationAuthContext } from '@/auth/auth-actions';
import type { AuthContext } from '@/entities/auth/authContext.entities';
import { CreateHeatmapCaptureLinkSchema } from '@/entities/analytics/heatmapCaptures.entities';
import { createCaptureLink, deleteCapture } from '@/services/analytics/heatmapCaptures.service';
import { z } from 'zod';

export const createHeatmapCaptureLinkAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof CreateHeatmapCaptureLinkSchema>) => {
    return await createCaptureLink(ctx, CreateHeatmapCaptureLinkSchema.parse(input));
  },
  { permission: 'canCaptureHeatmaps' },
);

export const deleteHeatmapCaptureAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, captureId: string) => {
    await deleteCapture(ctx, z.string().min(1).parse(captureId));
  },
  { permission: 'canCaptureHeatmaps' },
);

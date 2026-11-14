'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import type { TrackingStatus } from '@/entities/dashboard/verification.entities';
import { getTrackingStatus } from '@/services/dashboard/verification.service';

export const verifyTrackingInstallation = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<TrackingStatus> => {
    const { siteId } = ctx;

    try {
      return await getTrackingStatus(siteId);
    } catch (error) {
      console.error('Verification failed:', error);
      return { isReceiving: false, lastEventAt: null };
    }
  },
);

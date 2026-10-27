'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useDashboardId } from './use-dashboard-id';
import { verifyTrackingInstallation } from '@/app/actions/index.actions';
import type { TrackingStatus } from '@/entities/dashboard/verification.entities';
import { toast } from 'sonner';

export function useTrackingVerificationWithId(dashboardId: string | undefined) {
  const t = useTranslations('components.integration');
  const [status, setStatus] = useState<TrackingStatus | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifySilently = useCallback(async () => {
    if (!dashboardId) return false;

    try {
      const result = await verifyTrackingInstallation(dashboardId);
      setStatus(result);
      return result.isReceiving;
    } catch {
      return false;
    }
  }, [dashboardId]);

  useEffect(() => {
    if (dashboardId && status === null) {
      verifySilently();
    }
  }, [dashboardId, status, verifySilently]);

  const verify = useCallback(async () => {
    if (!dashboardId) {
      toast.error('Dashboard ID not found');
      return false;
    }

    setIsVerifying(true);

    try {
      const result = await verifyTrackingInstallation(dashboardId);
      setStatus(result);

      if (result.isReceiving) {
        toast.success('Tracking verified successfully!');
      } else if (result.lastEventAt) {
        toast.info(t('noRecentEvents'));
      } else {
        toast.info('No data received yet - visit your website to generate some events');
      }

      return result.isReceiving;
    } catch {
      toast.error('Failed to verify tracking status');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [dashboardId, t]);

  return {
    isVerified: status?.isReceiving === true,
    hasReceivedData: status?.lastEventAt != null,
    lastEventAt: status?.lastEventAt ?? null,
    isLoading: status === null,
    isVerifying,
    verifySilently,
    verify,
  };
}

export function useTrackingVerification() {
  const dashboardId = useDashboardId();
  return useTrackingVerificationWithId(dashboardId);
}

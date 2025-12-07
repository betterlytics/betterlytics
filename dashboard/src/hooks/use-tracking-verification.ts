'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardId } from './use-dashboard-id';
import { verifyTrackingInstallation } from '@/app/actions/index.actions';
import { toast } from 'sonner';

export function useTrackingVerificationWithId(dashboardId: string | undefined) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifySilently = useCallback(async () => {
    if (!dashboardId) return false;

    try {
      const result = await verifyTrackingInstallation(dashboardId);
      setIsVerified(result);
      return result;
    } catch {
      return false;
    }
  }, [dashboardId]);

  useEffect(() => {
    if (dashboardId && isVerified === null) {
      verifySilently();
    }
  }, [dashboardId, isVerified, verifySilently]);

  const verify = useCallback(async () => {
    if (!dashboardId) {
      toast.error('Dashboard ID not found');
      return false;
    }

    setIsVerifying(true);

    try {
      const result = await verifyTrackingInstallation(dashboardId);
      setIsVerified(result);

      if (result) {
        toast.success('Tracking verified successfully!');
      } else {
        toast.info('No data received yet - visit your website to generate some events');
      }

      return result;
    } catch {
      toast.error('Failed to verify tracking status');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [dashboardId]);

  return {
    isVerified: isVerified === true,
    isLoading: isVerified === null,
    isVerifying,
    verifySilently,
    verify,
  };
}

export function useTrackingVerification() {
  const dashboardId = useDashboardId();
  return useTrackingVerificationWithId(dashboardId);
}

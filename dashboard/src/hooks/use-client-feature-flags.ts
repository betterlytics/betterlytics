'use client';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { useCallback, useMemo } from 'react';

export function useClientFeatureFlags() {
  const { NEXT_PUBLIC_IS_CLOUD } = usePublicEnvironmentVariablesContext();

  const featureFlags = useMemo(
    () =>
      ({
        enableBilling: NEXT_PUBLIC_IS_CLOUD,
        isCloud: NEXT_PUBLIC_IS_CLOUD,
      }) as const,
    [NEXT_PUBLIC_IS_CLOUD, NEXT_PUBLIC_IS_CLOUD],
  );

  const isFeatureFlagEnabled = useCallback(
    (flag: keyof typeof featureFlags) => {
      return featureFlags[flag];
    },
    [featureFlags],
  );

  return { featureFlags, isFeatureFlagEnabled };
}

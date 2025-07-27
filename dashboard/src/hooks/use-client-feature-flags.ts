'use client';
import { usePublicEnvironmentVariablesContext } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { createFeatureFlags } from '@/lib/feature-flags-factory';
import { useCallback, useMemo } from 'react';

export function useClientFeatureFlags() {
  const env = usePublicEnvironmentVariablesContext();

  const featureFlags = useMemo(() => createFeatureFlags(env), [env]);

  const isFeatureFlagEnabled = useCallback(
    (flag: keyof typeof featureFlags) => {
      return featureFlags[flag];
    },
    [featureFlags],
  );

  return { featureFlags, isFeatureFlagEnabled };
}

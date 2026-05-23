'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { UserSettings } from '@/entities/account/userSettings.entities';
import { useUserSettingsActions } from '@/contexts/UserSettingsProvider';

type ActionResult<T> = { success: true; data: T } | { success: false; error: { message: string } };

export type SettingMutationStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseUserSettingsMutationOptions<TInput> {
  action: (input: TInput) => Promise<ActionResult<UserSettings>>;
  savedIndicatorMs?: number;
  onSuccess?: (data: UserSettings) => void;
}

interface UseUserSettingsMutationReturn<TInput> {
  mutate: (input: TInput) => void;
  status: SettingMutationStatus;
}

export function useUserSettingsMutation<TInput extends Partial<UserSettings>>({
  action,
  onSuccess,
  savedIndicatorMs = 1500,
}: UseUserSettingsMutationOptions<TInput>): UseUserSettingsMutationReturn<TInput> {
  const { setSettings, getSettings } = useUserSettingsActions();
  const tDialog = useTranslations('components.userSettings.dialog');
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<SettingMutationStatus>('idle');
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const mutate = useCallback(
    (input: TInput) => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = null;
      }

      const ownedKeys = Object.keys(input) as Array<keyof UserSettings>;
      const snapshot = getSettings();
      const previousOwned = pickKeys(snapshot, ownedKeys);

      setSettings((prev) => ({ ...prev, ...input }));
      setStatus('saving');

      startTransition(async () => {
        const result = await action(input);
        if (result.success) {
          const serverOwned = pickKeys(result.data, ownedKeys);
          setSettings((prev) => ({ ...prev, ...serverOwned }));
          setStatus('saved');
          onSuccess?.(result.data);
          savedTimeoutRef.current = setTimeout(() => setStatus('idle'), savedIndicatorMs);
        } else {
          setSettings((prev) => ({ ...prev, ...previousOwned }));
          setStatus('error');
          toast.error(result.error.message || tDialog('toast.error'));
        }
      });
    },
    [action, getSettings, setSettings, onSuccess, savedIndicatorMs, tDialog],
  );

  return { mutate, status };
}

function pickKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

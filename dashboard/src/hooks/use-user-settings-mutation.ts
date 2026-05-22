'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
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

/**
 * Mutation hook for a single user setting field.
 *
 * Optimistically updates the user settings context, fires the action, and:
 *  - on success: replaces the context with the server response
 *  - on error: reverts to the snapshot taken before the optimistic update + toasts
 *
 * The `status` drives <SettingStatusIndicator/>.
 */
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

  const mutate = useCallback(
    (input: TInput) => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = null;
      }

      const snapshot = getSettings();
      setSettings({ ...snapshot, ...input });
      setStatus('saving');

      startTransition(async () => {
        const result = await action(input);
        if (result.success) {
          setSettings(result.data);
          setStatus('saved');
          onSuccess?.(result.data);
          savedTimeoutRef.current = setTimeout(() => setStatus('idle'), savedIndicatorMs);
        } else {
          setSettings(snapshot);
          setStatus('error');
          toast.error(result.error.message || tDialog('toast.error'));
        }
      });
    },
    [action, getSettings, setSettings, onSuccess, savedIndicatorMs, tDialog],
  );

  return { mutate, status };
}

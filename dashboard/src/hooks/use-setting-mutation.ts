'use client';

import { useCallback, useRef, useState, useTransition } from 'react';

type ActionResult<T> = { success: true; data: T } | { success: false; error: { message: string } };

export type SettingMutationStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseSettingMutationOptions<TInput, TResult> {
  action: (input: TInput) => Promise<ActionResult<TResult>>;
  onSuccess?: (data: TResult, input: TInput) => void;
  onError?: (message: string, input: TInput) => void;
  savedIndicatorMs?: number;
}

interface UseSettingMutationReturn<TInput> {
  mutate: (input: TInput) => void;
  status: SettingMutationStatus;
  error: string | null;
}

export function useSettingMutation<TInput, TResult>({
  action,
  onSuccess,
  onError,
  savedIndicatorMs = 1500,
}: UseSettingMutationOptions<TInput, TResult>): UseSettingMutationReturn<TInput> {
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState<SettingMutationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutate = useCallback(
    (input: TInput) => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = null;
      }
      setStatus('saving');
      setError(null);

      startTransition(async () => {
        const result = await action(input);
        if (result.success) {
          setStatus('saved');
          onSuccess?.(result.data, input);
          savedTimeoutRef.current = setTimeout(() => setStatus('idle'), savedIndicatorMs);
        } else {
          setStatus('error');
          setError(result.error.message);
          onError?.(result.error.message, input);
        }
      });
    },
    [action, onSuccess, onError, savedIndicatorMs],
  );

  return { mutate, status, error };
}

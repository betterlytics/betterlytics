import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_RESET_AFTER_MS = 2000;

type UseCopyOptions = {
  /** Error toast shown when the clipboard write fails. Omit to fail silently. */
  failedMessage?: string;
  /** How long `copied` stays true after a successful copy. (Default = 2000ms) */
  resetAfterMs?: number;
};

/**
 * Copies text to the clipboard, exposing a transient `copied` flag and a `copy` that resolves to
 * whether the write succeeded — so call sites can gate their own follow-up (a success toast, say).
 */
export function useCopy(options: UseCopyOptions = {}) {
  const { failedMessage, resetAfterMs = DEFAULT_RESET_AFTER_MS } = options;

  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        if (failedMessage) toast.error(failedMessage);
        return false;
      }

      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
      return true;
    },
    [failedMessage, resetAfterMs],
  );

  return { copied, copy };
}

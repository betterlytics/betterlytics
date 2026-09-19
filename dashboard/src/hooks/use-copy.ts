import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_RESET_AFTER_MS = 2000;

type UseCopyOptions = {
  /** Error toast shown when the clipboard write fails. Omit to fail silently. */
  failedMessage?: string;
  /** How long `copied` stays true after a successful copy. (Default = 2000ms) */
  resetAfterMs?: number;
};

/** Returns whether the text actually made it to the clipboard. */
async function writeToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // The clipboard API requires a secure context; plain-HTTP selfhost deploys need the legacy path
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const succeeded = document.execCommand('copy');
  textarea.remove();
  return succeeded;
}

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
      const succeeded = await writeToClipboard(text);
      if (!succeeded) {
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

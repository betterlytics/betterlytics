'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function useCopyToClipboard(resetAfterMs = 1400) {
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
      if (!succeeded) return;

      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs);
    },
    [resetAfterMs],
  );

  return { copied, copy };
}

type CopyButtonProps = {
  text: string;
  ariaLabel: string;
  /** Announced to screen readers after a successful copy. */
  copiedLabel: string;
  className?: string;
  iconClassName?: string;
};

export function CopyButton({ text, ariaLabel, copiedLabel, className, iconClassName }: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard();

  return (
    <button type='button' onClick={() => void copy(text)} aria-label={ariaLabel} className={className}>
      <span className='relative inline-flex' aria-hidden>
        <Copy
          className={cn(
            'transition-all duration-200',
            copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
            iconClassName,
          )}
        />
        <Check
          className={cn(
            'absolute inset-0 m-auto text-emerald-500 transition-all duration-200',
            copied ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
            iconClassName,
          )}
        />
      </span>
      <span aria-live='polite' className='sr-only'>
        {copied ? copiedLabel : ''}
      </span>
    </button>
  );
}

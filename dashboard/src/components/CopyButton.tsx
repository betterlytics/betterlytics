'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    (text: string) => {
      navigator.clipboard.writeText(text);
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
    <button type='button' onClick={() => copy(text)} aria-label={ariaLabel} className={className}>
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

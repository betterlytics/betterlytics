'use client';

import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCopy } from '@/hooks/use-copy';

type CopyButtonProps = {
  text: string;
  ariaLabel: string;
  /** Announced to screen readers after a successful copy. */
  copiedLabel: string;
  className?: string;
  iconClassName?: string;
};

export function CopyButton({ text, ariaLabel, copiedLabel, className, iconClassName }: CopyButtonProps) {
  const { copied, copy } = useCopy({ resetAfterMs: 1400 });

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

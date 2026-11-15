'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyButton({
  text,
  label,
  done,
  iconOnly,
  className,
}: {
  text: string;
  label: string;
  done: string;
  iconOnly?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <button
      type='button'
      className={className}
      title={iconOnly ? label : undefined}
      onClick={() => navigator.clipboard?.writeText(text).then(() => setCopied(true))}
    >
      {copied ? <Check className='size-3.5' aria-hidden /> : <Copy className='size-3.5' aria-hidden />}
      <span aria-live='polite' className={iconOnly ? 'sr-only' : undefined}>
        {copied ? done : label}
      </span>
    </button>
  );
}

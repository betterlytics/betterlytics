'use client';

import { useRef, type ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { useMidEllipsis } from '@/components/text-fit/use-mid-ellipsis';

type MidEllipsisTextProps = { value: string } & Omit<ComponentProps<'span'>, 'children' | 'ref'>;

/* Requires a width-constrained ancestor chain (min-w-0 / max-w-* up to a definite
   width); the span fits its value to its own laid-out width. Server render and
   first client paint show the full value end-ellipsized by the CSS backstop.
   While truncated, copy events yield the full value and aria-label/title expose
   it unless the caller supplies their own. Font is re-resolved on measurer epoch
   bumps only, not on style-driven font changes to this element. */
export function MidEllipsisText({ value, className, ...props }: MidEllipsisTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { text, isTruncated } = useMidEllipsis(ref, value);
  return (
    <span
      {...props}
      ref={ref}
      className={cn('block min-w-0 truncate [unicode-bidi:isolate]', className)}
      aria-label={props['aria-label'] ?? (isTruncated ? value : undefined)}
      title={props.title ?? (isTruncated ? value : undefined)}
      onCopy={
        isTruncated
          ? (e) => {
              e.preventDefault();
              e.clipboardData.setData('text/plain', value);
            }
          : props.onCopy
      }
    >
      {text}
    </span>
  );
}

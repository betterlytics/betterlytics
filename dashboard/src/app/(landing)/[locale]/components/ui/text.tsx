import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/landing/lib/cn';

export const TEXT_STYLES = {
  'display-1': 'text-display-1 font-medium max-sm:font-semibold',
  'display-2': 'text-display-2 font-medium max-sm:text-balance',
  title: 'text-title leading-6 font-medium tracking-ui',
  lede: 'text-lede text-balance',
  label: 'text-label leading-5 font-normal tracking-ui text-muted',
} as const;

type HeadingSize = 'display-1' | 'display-2' | 'title';

export function Heading({
  as: Tag,
  size,
  className,
  ...props
}: ComponentPropsWithoutRef<'h2'> & { as: 'h1' | 'h2' | 'h3'; size: HeadingSize }) {
  return <Tag className={cn(TEXT_STYLES[size], className)} {...props} />;
}

export function Lede({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return <p className={cn(TEXT_STYLES.lede, className)} {...props} />;
}

export function Label({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span className={cn(TEXT_STYLES.label, className)} {...props} />;
}

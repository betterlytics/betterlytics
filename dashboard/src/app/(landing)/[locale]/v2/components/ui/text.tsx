import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/landing/lib/cn';

/** The page's text styles, for elements that take a look without being one of the components below. */
export const TEXT_STYLES = {
  'display-1': 'text-display-1 font-medium',
  'display-2': 'text-display-2 font-medium',
  /** card and panel titles */
  title: 'text-title leading-6 font-medium tracking-ui',
  lede: 'text-lede text-balance',
  label: 'text-label leading-5 font-normal tracking-ui text-muted',
} as const;

type HeadingSize = 'display-1' | 'display-2' | 'title';

/**
 * A heading whose level and look are chosen apart: `as` places it in the page
 * outline (the hero's h1, an h2 per section, h3 within one) and `size` sets the type.
 */
export function Heading({
  as: Tag,
  size,
  className,
  ...props
}: ComponentPropsWithoutRef<'h2'> & { as: 'h1' | 'h2' | 'h3'; size: HeadingSize }) {
  return <Tag className={cn(TEXT_STYLES[size], className)} {...props} />;
}

/** The paragraph introducing a section or card, balanced across its lines. */
export function Lede({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
  return <p className={cn(TEXT_STYLES.lede, className)} {...props} />;
}

/**
 * A label for the reader (a stat's caption, "Works with"): sentence case in the
 * muted tone. Mono caps stay reserved for text that imitates an interface.
 */
export function Label({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return <span className={cn(TEXT_STYLES.label, className)} {...props} />;
}

import * as React from 'react';
import { cn } from '@/lib/utils';

type TextVariant = keyof typeof variantMap;

type TextTone = 'default' | 'muted' | 'success' | 'warning' | 'danger';

type TextProps<T extends React.ElementType = 'span'> = {
  as?: T;
  variant?: TextVariant;
  tone?: TextTone;
  truncate?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Enable tabular-nums for numeric alignment */
  tabular?: boolean;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>;

export function Text<T extends React.ElementType = 'span'>({
  as,
  variant = 'body',
  tone = 'default',
  truncate = false,
  align,
  tabular = false,
  className,
  ...props
}: TextProps<T>) {
  const Component = as ?? 'span';

  return (
    <Component
      className={cn(
        variantMap[variant],
        tone !== 'default' && toneMap[tone],
        align && alignMap[align],
        truncate && 'truncate',
        tabular && 'tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

const variantMap = {
  // Body text
  body: 'text-foreground text-sm',
  'body-sm': 'text-foreground text-xs',

  // Muted text variants
  description: 'text-muted-foreground text-sm',
  caption: 'text-muted-foreground text-xs',

  // Labels and headers
  label: 'text-muted-foreground text-sm font-semibold tracking-wide',
  'column-header': 'text-muted-foreground text-2xs font-semibold leading-tight uppercase',

  // Values (numeric data)
  value: 'text-foreground text-base font-semibold',
  'value-xs': 'text-foreground text-xs font-semibold',
  'value-sm': 'text-foreground text-sm font-semibold',
  'value-lg': 'text-foreground text-lg font-semibold',
  'value-xl': 'text-foreground text-xl font-semibold sm:text-2xl',

  // Headings
  'heading-sm': 'text-foreground text-lg font-semibold tracking-tight',
  'heading-md': 'text-foreground text-xl font-semibold tracking-tight sm:text-2xl',
  'heading-lg': 'text-foreground text-2xl font-semibold tracking-tight',
};

const toneMap: Record<Exclude<TextTone, 'default'>, string> = {
  muted: 'text-muted-foreground',
  success: 'text-emerald-600 dark:text-emerald-500',
  warning: 'text-amber-600 dark:text-amber-500',
  danger: 'text-destructive',
};

const alignMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

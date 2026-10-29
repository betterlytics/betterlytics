import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const alertToneVariants = cva('rounded-lg border', {
  variants: {
    variant: {
      info: 'border-info/30 bg-info/10 [&_[data-slot=alert-icon]]:text-info [&_[data-slot=alert-title]]:text-info-text',
      warning:
        'border-warning/30 bg-warning/10 [&_[data-slot=alert-icon]]:text-warning [&_[data-slot=alert-title]]:text-warning-text',
      success:
        'border-success/30 bg-success/10 [&_[data-slot=alert-icon]]:text-success [&_[data-slot=alert-title]]:text-success-text',
      destructive:
        'border-destructive/30 bg-destructive/10 [&_[data-slot=alert-icon]]:text-destructive [&_[data-slot=alert-title]]:text-destructive-text',
      neutral: 'border-border bg-muted/50 [&_[data-slot=alert-icon]]:text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

const alertLayout =
  'relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-y-0.5 px-4 py-3 text-sm [&:not(:has([data-slot=alert-title]))>[data-slot=alert-description]]:text-foreground';

type AlertVariant = NonNullable<VariantProps<typeof alertToneVariants>['variant']>;

const DEFAULT_ICONS: Record<AlertVariant, LucideIcon> = {
  info: Info,
  warning: TriangleAlert,
  success: CircleCheck,
  destructive: CircleAlert,
  neutral: Info,
};

type AlertProps = React.ComponentProps<'div'> &
  VariantProps<typeof alertToneVariants> & {
    icon?: LucideIcon | null;
  };

function Alert({ className, variant, icon, role, children, ...props }: AlertProps) {
  const tone = variant ?? 'neutral';
  const Icon = icon === undefined ? DEFAULT_ICONS[tone] : icon;

  return (
    <div
      data-slot='alert'
      role={role ?? (tone === 'destructive' ? 'alert' : undefined)}
      className={cn(alertToneVariants({ variant: tone }), alertLayout, className)}
      {...props}
    >
      {Icon && <Icon data-slot='alert-icon' aria-hidden className='mt-0.5 mr-3 size-4 shrink-0' />}
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-title'
      className={cn('text-foreground col-start-2 leading-snug font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-description'
      className={cn('text-muted-foreground col-start-2 leading-snug', className)}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-action'
      className={cn(
        'col-start-3 row-span-2 row-start-1 ml-3 self-center max-sm:col-start-2 max-sm:row-span-1 max-sm:row-start-auto max-sm:mt-2 max-sm:ml-0 max-sm:self-start',
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction, alertToneVariants };

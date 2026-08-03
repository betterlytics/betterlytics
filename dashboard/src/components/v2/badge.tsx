import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/components/v2/lib/cn';
import { focusRing } from '@/components/v2/lib/variants';

const badgeVariants = cva(
  [
    'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden',
    'rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
    '[&>svg]:pointer-events-none [&>svg]:size-3',
    focusRing,
  ],
  {
    variants: {
      intent: { neutral: '', accent: '', info: '', success: '', warning: '', danger: '' },
      appearance: { soft: '', solid: '', outline: 'bg-transparent' },
      pill: { true: 'rounded-full' },
    },
    compoundVariants: [
      {
        intent: 'neutral',
        appearance: 'soft',
        className: 'border-transparent bg-surface-sunken text-content-secondary',
      },
      {
        intent: 'neutral',
        appearance: 'solid',
        className: 'border-transparent bg-content-secondary text-content-on-accent',
      },
      { intent: 'neutral', appearance: 'outline', className: 'border-border-default text-content-secondary' },
      {
        intent: 'accent',
        appearance: 'soft',
        className: 'border-accent-border bg-accent-surface text-accent-content',
      },
      {
        intent: 'accent',
        appearance: 'solid',
        className: 'border-transparent bg-accent-base text-content-on-accent',
      },
      { intent: 'accent', appearance: 'outline', className: 'border-accent-border text-accent-content' },
      {
        intent: 'success',
        appearance: 'soft',
        className: 'border-intent-success-border bg-intent-success-surface text-intent-success-content',
      },
      {
        intent: 'success',
        appearance: 'solid',
        className: 'border-transparent bg-intent-success text-content-on-accent',
      },
      {
        intent: 'success',
        appearance: 'outline',
        className: 'border-intent-success-border text-intent-success-content',
      },
      {
        intent: 'warning',
        appearance: 'soft',
        className: 'border-intent-warning-border bg-intent-warning-surface text-intent-warning-content',
      },
      {
        intent: 'warning',
        appearance: 'solid',
        className: 'border-transparent bg-intent-warning text-content-on-accent',
      },
      {
        intent: 'warning',
        appearance: 'outline',
        className: 'border-intent-warning-border text-intent-warning-content',
      },
      {
        intent: 'danger',
        appearance: 'soft',
        className: 'border-intent-danger-border bg-intent-danger-surface text-intent-danger-content',
      },
      {
        intent: 'danger',
        appearance: 'solid',
        className: 'border-transparent bg-intent-danger text-content-on-accent',
      },
      {
        intent: 'danger',
        appearance: 'outline',
        className: 'border-intent-danger-border text-intent-danger-content',
      },
      {
        intent: 'info',
        appearance: 'soft',
        className: 'border-intent-info-border bg-intent-info-surface text-intent-info-content',
      },
      {
        intent: 'info',
        appearance: 'solid',
        className: 'border-transparent bg-intent-info text-content-on-accent',
      },
      { intent: 'info', appearance: 'outline', className: 'border-intent-info-border text-intent-info-content' },
    ],
    defaultVariants: { intent: 'neutral', appearance: 'soft', pill: false },
  },
);

export type BadgeIntent = NonNullable<VariantProps<typeof badgeVariants>['intent']>;
export type BadgeAppearance = NonNullable<VariantProps<typeof badgeVariants>['appearance']>;

type BadgeProps = React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean };

export function Badge({ className, intent, appearance, pill, asChild, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp data-slot='badge' className={cn(badgeVariants({ intent, appearance, pill }), className)} {...props} />
  );
}

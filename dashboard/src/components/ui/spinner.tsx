import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin',
  {
    variants: {
      size: {
        sm: 'w-4 h-4 border-2',
        default: 'w-8 h-8 border-2',
        lg: 'w-10 h-10 border-4',
        xl: 'w-12 h-12 border-4',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return <div className={cn(spinnerVariants({ size, className }))} {...props} />;
}

export { Spinner, spinnerVariants };

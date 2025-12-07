import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React from 'react';
import { cn } from '@/lib/utils';

type CountdownButtonProps = React.ComponentPropsWithRef<typeof Button> & {
  countdownDuration?: number;
  isPending: boolean;
};

function CountdownButton({
  className,
  variant = 'destructive',
  isPending,
  children,
  ref,
  ...props
}: CountdownButtonProps) {
  const baseClasses =
    '!bg-destructive/85 hover:!bg-destructive/80 dark:!bg-destructive/65 dark:hover:!bg-destructive/80 w-full cursor-pointer sm:w-auto !text-white';

  return (
    <Button ref={ref} variant={variant} className={cn(baseClasses, className)} {...props}>
      {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
      {children}
    </Button>
  );
}

export { CountdownButton };

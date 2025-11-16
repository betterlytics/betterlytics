import { Loader2, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { VariantProps } from 'class-variance-authority';

type CountdownButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    countdownDuration?: number;
    isPending: boolean;
  };

function CountdownButton({
  variant = 'destructive',
  className = 'hover:bg-destructive/80 dark:hover:bg-destructive/80 bg-destructive/85 w-full cursor-pointer sm:w-auto',
  isPending,
  children,
  ...props
}: CountdownButtonProps) {
  return (
    <Button variant={variant} className={className} {...props}>
      {isPending ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
      {children}
    </Button>
  );
}

export { CountdownButton };

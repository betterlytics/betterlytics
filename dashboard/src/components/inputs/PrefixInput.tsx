import { ComponentProps, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PrefixInputProps = ComponentProps<typeof Input> & {
  prefix: ReactNode;
};

export function PrefixInput({ prefix, className, ...restProps }: PrefixInputProps) {
  return (
    <div className='flex items-center rounded-md'>
      <div className='text-muted-foreground/90 border-card-foreground/20 bg-muted flex h-10 items-center rounded-s-md border px-2 text-sm'>
        {prefix}
      </div>
      <Input {...restProps} className={cn('h-10 rounded-s-none rounded-e-md', className)} />
    </div>
  );
}

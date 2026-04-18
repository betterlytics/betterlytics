import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TableProps = {
  tableOnly?: boolean;
  className?: string;
};

export default function TableSkeleton({ tableOnly, className }: TableProps) {
  return (
    <div className={cn('bg-card rounded-lg', !tableOnly && 'border p-6', className)}>
      {!tableOnly && <Skeleton className='mb-6 h-6 w-1/3' />}
      <div className='space-y-4'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className='flex justify-between'>
            <Skeleton className='h-4 w-full' />
          </div>
        ))}
      </div>
    </div>
  );
}

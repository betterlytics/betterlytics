import { Skeleton } from '@/components/ui/skeleton';
const ROW_WIDTHS = [100, 78, 61, 47, 35, 26, 19, 14];

export default function MultiProgressTableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className='space-y-2'>
      {Array.from({ length: rows }, (_, i) => {
        const width = ROW_WIDTHS[Math.min(i, ROW_WIDTHS.length - 1)];
        return (
          <div key={i} className='relative h-7'>
            <Skeleton className='absolute inset-y-0 left-0 rounded-sm' style={{ width: `${width}%` }} />
            <div className='absolute inset-y-0 right-3 flex items-center'>
              <Skeleton className='h-3 w-5 rounded' />
            </div>
          </div>
        );
      })}
    </div>
  );
}

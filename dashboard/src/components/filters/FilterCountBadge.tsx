import { Badge } from '@/components/ui/badge';

export function FilterCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge variant='default' className='h-4.5 min-w-4.5 rounded-full px-1 text-[11px] tabular-nums'>
      {count}
    </Badge>
  );
}

import { MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

type MonitorTableProps = {
  monitorsPromise: Promise<MonitorCheck[]>;
  copy: {
    emptyTitle: string;
    emptyDescription: string;
    caption: string;
    headers: {
      name: string;
      url: string;
      interval: string;
      timeout: string;
      status: string;
      created: string;
    };
    enabled: string;
    disabled: string;
  };
};

export async function MonitorTable({ monitorsPromise, copy }: MonitorTableProps) {
  const monitors = await monitorsPromise;

  if (!monitors.length) {
    return (
      <div className='border-muted bg-card text-muted-foreground flex flex-col items-start gap-2 rounded-xl border p-6'>
        <p className='text-sm font-medium'>{copy.emptyTitle}</p>
        <p className='text-muted-foreground text-xs'>{copy.emptyDescription}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption className='text-muted-foreground text-left text-sm'>{copy.caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.headers.name}</TableHead>
          <TableHead>{copy.headers.url}</TableHead>
          <TableHead className='w-[120px]'>{copy.headers.interval}</TableHead>
          <TableHead className='w-[120px]'>{copy.headers.timeout}</TableHead>
          <TableHead className='w-[100px]'>{copy.headers.status}</TableHead>
          <TableHead className='w-[160px]'>{copy.headers.created}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monitors.map((monitor) => (
          <TableRow key={monitor.id}>
            <TableCell className='font-medium'>{monitor.name || '—'}</TableCell>
            <TableCell className='max-w-[260px] truncate'>{monitor.url}</TableCell>
            <TableCell>{monitor.intervalSeconds}s</TableCell>
            <TableCell>{monitor.timeoutMs}ms</TableCell>
            <TableCell>
              <Badge variant={monitor.isEnabled ? 'default' : 'secondary'}>
                {monitor.isEnabled ? copy.enabled : copy.disabled}
              </Badge>
            </TableCell>
            <TableCell className='text-muted-foreground'>
              {formatDistanceToNow(monitor.createdAt, { addSuffix: true })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

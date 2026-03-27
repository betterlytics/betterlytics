'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { STATUS_CONFIG } from './errors.constants';

const MOCK_ERRORS = [
  {
    type: 'TypeError',
    message: "Cannot read properties of null (reading 'addEventListener')",
    occurrences: '1.2K',
    sessions: '341',
    firstSeen: '3d ago',
    lastSeen: '2m ago',
    status: 'unresolved' as const,
  },
  {
    type: 'ReferenceError',
    message: 'Cannot access variable before initialization',
    occurrences: '234',
    sessions: '89',
    firstSeen: '1w ago',
    lastSeen: '14m ago',
    status: 'unresolved' as const,
  },
  {
    type: 'SyntaxError',
    message: 'Unexpected token in JSON at position 0',
    occurrences: '47',
    sessions: '12',
    firstSeen: '2w ago',
    lastSeen: '1h ago',
    status: 'resolved' as const,
  },
  {
    type: 'Error',
    message: 'Network request failed: timeout after 30000ms',
    occurrences: '18',
    sessions: '7',
    firstSeen: '5d ago',
    lastSeen: '3h ago',
    status: 'ignored' as const,
  },
];

function MockSparkline() {
  const bars = [20, 45, 30, 65, 80, 55, 40, 70, 50, 35];
  return (
    <div className='flex h-6 w-20 items-end gap-[2px]'>
      {bars.map((height, i) => (
        <span key={i} className='bg-destructive/40 flex-1 rounded-sm' style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function ErrorsEmptyState() {
  const t = useTranslations('errors');
  return (
    <div className='relative mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center'>
      <div className='relative w-full'>
        <div className='border-border overflow-hidden rounded-lg border opacity-40'>
          <Table className='min-w-[800px]'>
            <TableHeader>
              <TableRow className='border-muted-foreground bg-accent hover:bg-accent border-b'>
                <TableHead className='text-foreground bg-muted/50 w-10 py-3 pl-4 text-sm font-medium sm:pl-6'>
                  <Checkbox disabled aria-label={t('table.selectAll')} />
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 px-3 py-3 text-sm font-medium sm:px-6'>
                  {t('table.columns.error')}
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 hidden px-3 py-3 text-sm font-medium sm:px-6 xl:table-cell'>
                  {t('table.columns.volume')}
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 px-3 py-3 text-center text-sm font-medium sm:px-6'>
                  {t('table.columns.occurrences')}
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 px-3 py-3 text-center text-sm font-medium sm:px-6'>
                  {t('table.columns.sessions')}
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 px-3 py-3 text-sm font-medium sm:px-6'>
                  {t('table.columns.firstSeen')}
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 px-3 py-3 text-sm font-medium sm:px-6'>
                  {t('table.columns.lastSeen')}
                </TableHead>
                <TableHead className='text-foreground bg-muted/50 px-3 py-3 text-sm font-medium sm:px-6'>
                  {t('table.columns.status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className='divide-secondary divide-y'>
              {MOCK_ERRORS.map((error, i) => {
                const cfg = STATUS_CONFIG[error.status];
                return (
                  <TableRow key={i} className='hover:bg-transparent'>
                    <TableCell className='w-10 py-3 pl-4 sm:pl-6'>
                      <Checkbox disabled aria-label={t('table.selectRow')} />
                    </TableCell>
                    <TableCell className='text-muted-foreground w-full max-w-0 min-w-[200px] py-3 pl-2 text-sm sm:px-6'>
                      <div className='min-w-0'>
                        <div className='font-mono text-sm font-semibold'>{error.type}</div>
                        <div className='text-muted-foreground truncate text-sm'>{error.message}</div>
                      </div>
                    </TableCell>
                    <TableCell className='text-muted-foreground hidden px-3 py-3 text-sm sm:px-6 xl:table-cell'>
                      <MockSparkline />
                    </TableCell>
                    <TableCell className='text-muted-foreground px-3 py-3 text-center text-sm tabular-nums sm:px-6'>
                      {error.occurrences}
                    </TableCell>
                    <TableCell className='text-muted-foreground px-3 py-3 text-center text-sm tabular-nums sm:px-6'>
                      {error.sessions}
                    </TableCell>
                    <TableCell className='text-muted-foreground px-3 py-3 text-sm sm:px-6'>
                      {error.firstSeen}
                    </TableCell>
                    <TableCell className='text-muted-foreground px-3 py-3 text-sm sm:px-6'>
                      {error.lastSeen}
                    </TableCell>
                    <TableCell className='text-muted-foreground px-3 py-3 text-sm sm:px-6'>
                      <Badge variant='outline' className={cfg.className}>
                        {t(`status.${error.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className='from-background via-background/60 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t' />

        <div className='pointer-events-auto absolute inset-0 flex flex-col items-center justify-center'>
          <div className='bg-background/70 space-y-4 rounded-xl px-8 py-6 text-center backdrop-blur-sm'>
            <div className='space-y-2'>
              <h2 className='text-2xl font-semibold tracking-tight'>{t('emptyState.title')}</h2>
              <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>
                {t('emptyState.description')}
              </p>
            </div>
            <Button asChild>
              <Link href='https://betterlytics.io/docs/dashboard/error-tracking' target='_blank'>
                <ExternalLink className='mr-2 h-4 w-4' />
                {t('emptyState.learnMore')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

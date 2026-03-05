'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const MOCK_ERRORS = [
  { type: 'ReferenceError', message: 'Cannot access variable before initialization', events: '47', sessions: '12' },
  { type: 'TypeError', message: "Cannot read properties of null (reading 'addEventListener')", events: '234', sessions: '89' },
  { type: 'SyntaxError', message: 'Unexpected token in JSON at position 0', events: '1,203', sessions: '341' },
];

function SkeletonErrorRow({
  error,
  isMain = false,
}: {
  error: (typeof MOCK_ERRORS)[0];
  isMain?: boolean;
}) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden px-4 py-3',
        isMain
          ? 'border-border/50 bg-card shadow-destructive/5 ring-destructive/10 shadow-lg ring-1'
          : 'border-border/30 bg-card/80',
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b',
          isMain ? 'from-destructive to-destructive/50' : 'from-destructive/50 to-destructive/20',
        )}
        aria-hidden
      />

      <div className='flex items-center gap-4'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <div className='min-w-0 flex-1'>
            <div className={cn('truncate text-sm font-medium', isMain ? 'text-foreground' : 'text-foreground/50')}>
              {error.type}
            </div>
            <div className='text-muted-foreground/50 truncate text-xs'>{error.message}</div>
          </div>
        </div>

        <div className='hidden items-center gap-6 sm:flex'>
          <div className='text-center'>
            <div className='text-muted-foreground/40 text-[10px] font-medium tracking-wider uppercase'>Events</div>
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                isMain ? 'text-foreground/70' : 'text-foreground/40',
              )}
            >
              {error.events}
            </div>
          </div>

          <div className='text-center'>
            <div className='text-muted-foreground/40 text-[10px] font-medium tracking-wider uppercase'>Sessions</div>
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                isMain ? 'text-foreground/70' : 'text-foreground/40',
              )}
            >
              {error.sessions}
            </div>
          </div>

          <div className='w-24 lg:w-32'>
            <div
              className={cn(
                'flex h-8 items-end gap-[2px] rounded-md border p-1.5',
                isMain ? 'border-border/30 bg-muted/30' : 'border-border/20 bg-background/10',
              )}
            >
              {[30, 55, 40, 70, 85, 60, 45, 75].map((height, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex-1 rounded-sm bg-gradient-to-t',
                    isMain ? 'from-destructive to-destructive/60' : 'from-destructive/40 to-destructive/20',
                  )}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FannedErrorPreview() {
  return (
    <div className='relative w-full space-y-[-30px]'>
      <div className='opacity-35' style={{ transform: 'scale(0.94)' }}>
        <SkeletonErrorRow error={MOCK_ERRORS[0]} />
      </div>
      <div className='opacity-85' style={{ transform: 'scale(0.97)' }}>
        <SkeletonErrorRow error={MOCK_ERRORS[1]} />
      </div>
      <div className='relative z-10'>
        <SkeletonErrorRow error={MOCK_ERRORS[2]} isMain />
      </div>
    </div>
  );
}

export function ErrorsEmptyState() {
  return (
    <div className='relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-4 pt-8 pb-4 sm:justify-center sm:pt-14 sm:pb-4'>
      <div className='relative flex flex-col space-y-6 sm:order-2 sm:flex-none sm:pt-12'>
        <div className='space-y-3 text-center'>
          <h2 className='text-2xl font-semibold tracking-tight'>No errors detected</h2>
          <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>
            When JavaScript errors occur on your site, they will appear here grouped by type. Set up error tracking to
            catch and monitor client-side exceptions.
          </p>
        </div>
        <div className='flex justify-center'>
          <Button asChild className='shadow-primary/10 shadow-lg'>
            <Link href='https://betterlytics.io/docs/dashboard/error-tracking' target='_blank'>
              <ExternalLink className='mr-2 h-4 w-4' />
              Learn about error tracking
            </Link>
          </Button>
        </div>
      </div>

      <div className='relative mt-12 w-full sm:order-1 sm:mt-0'>
        <FannedErrorPreview />
      </div>
    </div>
  );
}

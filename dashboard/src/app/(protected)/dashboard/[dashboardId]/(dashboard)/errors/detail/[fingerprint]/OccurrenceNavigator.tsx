'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import type { ErrorOccurrence } from '@/entities/analytics/errors.entities';

function UrlTooltip({ url, className }: { url: string; className?: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('text-muted-foreground cursor-default truncate text-xs', className)}>{url}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{url}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type OccurrenceNavigatorProps = {
  occurrence: ErrorOccurrence | null;
  occurrenceNumber: number;
  totalCount: number;
  canGoOlder: boolean;
  canGoNewer: boolean;
  isPending: boolean;
  onNavigate: (offset: number) => void;
  currentOffset: number;
};

export function OccurrenceNavigator({
  occurrence,
  occurrenceNumber,
  totalCount,
  canGoOlder,
  canGoNewer,
  isPending,
  onNavigate,
  currentOffset,
}: OccurrenceNavigatorProps) {
  return (
    <div className='border-border bg-muted/30 min-w-0 overflow-hidden rounded-t-xl border-b px-4 py-2'>
      <div className='flex items-center justify-between gap-2 xl:grid xl:grid-cols-3'>
        {occurrence ? (
          <span className='text-muted-foreground shrink-0 text-xs'>
            {formatLocalDateTime(occurrence.timestamp, undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        ) : (
          <span />
        )}
        {occurrence?.url ? (
          <UrlTooltip url={occurrence.url} className='hidden min-w-0 text-center xl:block' />
        ) : (
          <span className='hidden xl:block' />
        )}
        <div className='flex items-center justify-end gap-1'>
          <span className='text-muted-foreground shrink-0 text-xs'>
            Occurrence <span className='text-foreground font-medium'>{occurrenceNumber}</span> of {totalCount}
          </span>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onNavigate(totalCount - 1)}
            disabled={!canGoOlder || isPending}
            className='text-muted-foreground h-7 w-7 cursor-pointer'
            title='First occurrence'
          >
            <ChevronsLeft className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onNavigate(currentOffset + 1)}
            disabled={!canGoOlder || isPending}
            className='text-muted-foreground h-7 w-7 cursor-pointer'
            title='Older occurrence'
          >
            <ChevronLeft className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onNavigate(currentOffset - 1)}
            disabled={!canGoNewer || isPending}
            className='text-muted-foreground h-7 w-7 cursor-pointer'
            title='Newer occurrence'
          >
            <ChevronRight className='h-3.5 w-3.5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onNavigate(0)}
            disabled={!canGoNewer || isPending}
            className='text-muted-foreground h-7 w-7 cursor-pointer'
            title='Latest occurrence'
          >
            <ChevronsRight className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>
      {occurrence?.url ? <UrlTooltip url={occurrence.url} className='block xl:hidden' /> : null}
    </div>
  );
}

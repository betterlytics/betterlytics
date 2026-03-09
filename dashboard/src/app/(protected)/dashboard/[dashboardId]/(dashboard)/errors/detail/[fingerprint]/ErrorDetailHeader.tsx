'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle, ChevronDown, EyeOff, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import { upsertErrorGroupAction } from '@/app/actions/analytics/errors.actions';

const STATUS_CONFIG: Record<ErrorGroupStatusValue, { label: string; className: string }> = {
  unresolved: {
    label: 'Unresolved',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  resolved: {
    label: 'Resolved',
    className:
      'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  },
  ignored: {
    label: 'Ignored',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

type ErrorDetailHeaderProps = {
  dashboardId: string;
  errorGroup: ErrorGroupRow;
};

export function ErrorDetailHeader({ dashboardId, errorGroup }: ErrorDetailHeaderProps) {
  const [status, setStatus] = useState<ErrorGroupStatusValue>(errorGroup.status);
  const [isPending, startTransition] = useTransition();
  const cfg = STATUS_CONFIG[status];

  function updateStatus(newStatus: ErrorGroupStatusValue) {
    setStatus(newStatus);
    startTransition(async () => {
      await upsertErrorGroupAction(dashboardId, errorGroup.error_fingerprint, newStatus);
    });
  }

  return (
    <div className='space-y-4'>
      <Link
        href={`/dashboard/${dashboardId}/errors`}
        className='text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
        Back to errors
      </Link>

      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='font-mono text-2xl font-bold'>{errorGroup.error_type}</h1>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className='text-muted-foreground line-clamp-2 text-sm'>{errorGroup.error_message}</p>
        </div>

        <div className='flex shrink-0 items-center gap-2 pt-1'>
          {status === 'unresolved' ? (
            <div className='flex'>
              <Button
                variant='outline'
                size='sm'
                className='rounded-r-none border-r-0'
                onClick={() => updateStatus('resolved')}
                disabled={isPending}
              >
                <CheckCircle className='mr-1.5 h-4 w-4 text-emerald-600' />
                Resolve
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='rounded-l-none px-2' disabled={isPending}>
                    <ChevronDown className='h-3.5 w-3.5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => updateStatus('ignored')}>
                    <EyeOff className='mr-2 h-4 w-4' />
                    Ignore
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant='outline' size='sm' onClick={() => updateStatus('unresolved')} disabled={isPending}>
              <RotateCcw className='mr-1.5 h-4 w-4' />
              Unresolve
            </Button>
          )}
          <Button variant='outline' size='sm'>
            <Share2 className='mr-1.5 h-4 w-4' />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

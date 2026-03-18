'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, CheckCircle, ChevronDown, EyeOff, RotateCcw, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import { upsertErrorGroupAction } from '@/app/actions/analytics/errors.actions';
import { STATUS_CONFIG } from '../../errors.constants';

type ErrorDetailHeaderProps = {
  dashboardId: string;
  errorGroup: ErrorGroupRow;
};

export function ErrorDetailHeader({ dashboardId, errorGroup }: ErrorDetailHeaderProps) {
  const [status, setStatus] = useState<ErrorGroupStatusValue>(errorGroup.status);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function copyShareUrl() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
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

      <div className='space-y-1'>
        <div className='flex flex-wrap items-center gap-2.5'>
          <h1 className='font-mono text-2xl font-bold'>{errorGroup.error_type}</h1>
          <Badge variant='outline' className={`mt-1.5 rounded-full ${cfg.className}`}>
            {cfg.label}
          </Badge>
        </div>
        <div className='flex items-center justify-between gap-4'>
          <p className='text-muted-foreground line-clamp-2 min-w-0 text-sm'>{errorGroup.error_message}</p>
          <div className='flex shrink-0 items-center gap-2'>
            {status === 'unresolved' ? (
              <div className='flex'>
                <Button
                  variant='outline'
                  size='sm'
                  className='cursor-pointer rounded-r-none border-r-0'
                  onClick={() => updateStatus('resolved')}
                  disabled={isPending}
                >
                  <CheckCircle className='mr-1.5 h-4 w-4 text-emerald-600' />
                  Resolve
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='cursor-pointer rounded-l-none px-2' disabled={isPending}>
                      <ChevronDown className='h-3.5 w-3.5' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem className='cursor-pointer' onClick={() => updateStatus('ignored')}>
                      <EyeOff className='mr-2 h-4 w-4' />
                      Ignore
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant='outline' size='sm' className='cursor-pointer' onClick={() => updateStatus('unresolved')} disabled={isPending}>
                <RotateCcw className='mr-1.5 h-4 w-4' />
                Unresolve
              </Button>
            )}
            <Button variant='outline' size='sm' className='cursor-pointer' onClick={copyShareUrl}>
              {copied ? (
                <Check className='mr-1.5 h-4 w-4 text-emerald-600' />
              ) : (
                <Share2 className='mr-1.5 h-4 w-4' />
              )}
              {copied ? 'Copied!' : 'Share'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

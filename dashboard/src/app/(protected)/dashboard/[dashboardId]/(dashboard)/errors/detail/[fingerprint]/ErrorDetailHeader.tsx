'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ChevronLeft, Check, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ErrorGroupRow, ErrorGroupStatusValue } from '@/entities/analytics/errors.entities';
import { cn } from '@/lib/utils';
import { upsertErrorGroupAction } from '@/app/actions/analytics/errors.actions';
import { STATUS_CONFIG } from '../../errors.constants';
import { ErrorStatusActions } from '../../ErrorStatusActions';
import { useTranslations } from 'next-intl';

type ErrorDetailHeaderProps = {
  dashboardId: string;
  errorGroup: ErrorGroupRow;
};

export function ErrorDetailHeader({ dashboardId, errorGroup }: ErrorDetailHeaderProps) {
  const t = useTranslations('errors.detail.header');
  const tStatus = useTranslations('errors.status');
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
        {t('backToErrors')}
      </Link>

      <div className='space-y-1'>
        <div className='flex flex-wrap items-center gap-2.5'>
          <h1 className='font-mono text-2xl font-bold'>{errorGroup.error_type}</h1>
          <Badge variant='outline' className={cn('mt-1.5 rounded-full', cfg.className)}>
            {tStatus(status)}
          </Badge>
        </div>
        <div className='flex items-center justify-between gap-4'>
          <p className='text-muted-foreground line-clamp-2 min-w-0 text-sm'>{errorGroup.error_message}</p>
          <div className='flex shrink-0 items-center gap-2'>
            <ErrorStatusActions
              canResolve={status !== 'resolved'}
              canIgnore={status !== 'ignored'}
              canUnresolve={status !== 'unresolved'}
              onResolve={() => updateStatus('resolved')}
              onIgnore={() => updateStatus('ignored')}
              onUnresolve={() => updateStatus('unresolved')}
              isPending={isPending}
            />
            <Button variant='outline' size='sm' className='cursor-pointer' onClick={copyShareUrl}>
              {copied ? (
                <Check className='mr-1.5 h-4 w-4 text-emerald-600' />
              ) : (
                <Share2 className='mr-1.5 h-4 w-4' />
              )}
              {copied ? t('copied') : t('share')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

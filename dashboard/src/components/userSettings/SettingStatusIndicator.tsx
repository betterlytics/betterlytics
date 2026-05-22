'use client';

import { Check, Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SettingMutationStatus } from '@/hooks/use-setting-mutation';

interface SettingStatusIndicatorProps {
  status: SettingMutationStatus;
  className?: string;
}

export default function SettingStatusIndicator({ status, className }: SettingStatusIndicatorProps) {
  const t = useTranslations('components.userSettings.status');

  if (status === 'idle') {
    return null;
  }

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs',
        status === 'saving' && 'text-muted-foreground',
        status === 'saved' && 'text-green-600',
        status === 'error' && 'text-destructive',
        className,
      )}
    >
      {status === 'saving' && <Loader2 className='h-3 w-3 animate-spin' />}
      {status === 'saved' && <Check className='h-3 w-3' />}
      {status === 'error' && <AlertCircle className='h-3 w-3' />}
      <span>{t(status)}</span>
    </span>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const MAX_PILLS = 2;

export function MonitorPills({ names }: { names: string[] }) {
  const t = useTranslations('statusPagesPage.editor.incidents');
  const shown = names.slice(0, MAX_PILLS);
  const hidden = names.slice(MAX_PILLS);

  return (
    <div className='flex items-center gap-1'>
      {shown.map((name, i) => (
        <Badge key={i} variant='secondary' className='border-border max-w-35 font-normal'>
          <span className='min-w-0 truncate'>{name}</span>
        </Badge>
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant='outline' className='border-border text-muted-foreground cursor-help font-normal'>
              {t('affectedMore', { count: hidden.length })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            className='border-border bg-popover/95 text-popover-foreground pointer-events-none max-w-60 rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
          >
            <ul className='space-y-0.5 text-xs'>
              {hidden.map((name, i) => (
                <li key={i} className='truncate'>
                  {name}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InfoBadgeProps {
  icon?: React.ReactNode;
  tooltip?: string;
  ariaLabel?: string;
  className?: string;
}

function EmptySessionDataBadge() {
  const t = useTranslations('misc');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
          aria-label={t('unknown')}
        >
          <HelpCircle size='1rem' />
        </span>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{t('unknown')}</TooltipContent>
    </Tooltip>
  );
}

export const InfoBadge: React.FC<InfoBadgeProps> = ({ icon, tooltip, ariaLabel, className }) => {
  if (!icon) return <EmptySessionDataBadge />;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border',
            className,
          )}
          aria-label={ariaLabel}
        >
          {icon}
        </span>
      </TooltipTrigger>
      <TooltipContent side='bottom'>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

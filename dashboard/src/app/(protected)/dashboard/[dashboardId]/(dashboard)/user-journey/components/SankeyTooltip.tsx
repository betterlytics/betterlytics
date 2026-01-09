import { formatNumber } from '@/utils/formatters';
import { useTranslations } from 'next-intl';
import type { TooltipState } from '../types';

export function TooltipComponent({ tooltip }: { tooltip: TooltipState }) {
  const t = useTranslations('components.userJourney');

  if (!tooltip.visible || !tooltip.content) return null;
  return (
    <div
      className='absolute z-50'
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        pointerEvents: 'none',
      }}
    >
      <div className='border-border bg-popover/95 animate-in fade-in-0 zoom-in-95 min-w-[220px] rounded-lg border p-3 shadow-xl backdrop-blur-sm duration-200'>
        <div className='space-y-1.5'>
          <div className='flex items-center justify-between gap-3'>
            <span className='text-popover-foreground text-xs'>
              {tooltip.content.source} → {tooltip.content.target}
            </span>
          </div>
          <div className='text-popover-foreground/80 text-xs'>
            {t('sessions')}: {formatNumber(tooltip.content.value)}
          </div>
        </div>
      </div>
    </div>
  );
}

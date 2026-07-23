import { formatNumber, formatPercentage } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';
import { TrendIndicator } from '@/components/TrendIndicator';
import { TrendPercentage } from '@/components/TrendPercentage';
import { cn } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

type PropertyValue = {
  value: string;
  count: number;
  relativePercentage: number;
  percentage: number;
  trendPercentage?: number;
  comparisonValue?: number;
};

interface PropertyValueBarProps {
  value: PropertyValue;
  icon?: React.ReactElement;
  index?: number;
  respectComparison?: boolean;
  leading?: React.ReactNode;
}

export function PropertyValueBar({ value, icon, respectComparison, index, leading }: PropertyValueBarProps) {
  const locale = useLocale();
  const t = useTranslations('misc');

  return (
    <div className='group shadow-foreground/20 dark:shadow-background relative rounded-sm shadow-xs transition-colors duration-200 hover:bg-[var(--accent)]/80'>
      <div className='relative h-7 overflow-hidden rounded-sm text-sm'>
        <Progress
          value={Math.max(value.relativePercentage, 2)}
          className='bg-muted/30 group-hover:bg-muted/40 [&>div]:bg-primary/35 h-full rounded-sm transition-colors duration-200'
        />

        <div className={cn('absolute inset-0 z-10 flex items-center justify-between px-3', leading && 'pl-1')}>
          <div className='flex max-w-[85%] items-center gap-2 truncate'>
            {leading}
            {typeof index === 'number' && <span className='text-foreground w-3 font-medium'>{index}.</span>}
            {icon && <span className='flex-shrink-0'>{icon}</span>}
            <span className='text-foreground truncate font-medium'>{value.value}</span>
          </div>

          <div className='text-muted-foreground flex gap-2'>
            <div className='opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              <div className='hidden gap-1 transition-all transition-discrete duration-200 group-hover:flex'>
                {value.comparisonValue && (
                  <span>
                    <TrendPercentage percentage={value.trendPercentage} withParenthesis noChangeText={t('noChange')} locale={locale} />
                  </span>
                )}
                {formatPercentage(value.percentage, locale)}
              </div>
            </div>
            <span>{formatNumber(value.count, locale)}</span>
            {value.comparisonValue && <TrendIndicator percentage={value.trendPercentage} />}
            {!value.comparisonValue && respectComparison && <div className='size-3.5' />}
          </div>
        </div>
      </div>
    </div>
  );
}

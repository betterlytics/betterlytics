import { Minus } from 'lucide-react';
import { TrendPercentage } from './TrendPercentage';

type TableTrendIndicatorProps = {
  current: number;
  compare?: number;
  percentage?: number;
  formatter?: (value: number) => string;
};

export function TableTrendIndicator({
  current,
  compare,
  percentage,
  formatter = (val) => val.toLocaleString(),
}: TableTrendIndicatorProps) {
  if (percentage === undefined) {
    return null;
  }

  const comparedData = compare || 0;

  const difference = current - comparedData;

  if (difference === 0 && current !== 0) {
    return (
      <div className='flex items-center gap-1 text-xs opacity-85'>
        <span className='text-muted-foreground'>vs {formatter(comparedData)}</span>
        <Minus className='h-3 w-3' />
        <span>0%</span>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-1 text-xs'>
      <span className='text-foreground opacity-75'>vs {formatter(comparedData)}</span>
      {comparedData !== 0 && <TrendPercentage percentage={percentage} withIcon />}
    </div>
  );
}

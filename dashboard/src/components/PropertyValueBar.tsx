import { formatPercentage } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';
import { TrendIndicator } from '@/components/TrendIndicator';
import { TrendPercentage } from '@/components/TrendPercentage';

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
}

export function PropertyValueBar({ value, icon, index }: PropertyValueBarProps) {
  return (
    <div className='group relative rounded-sm transition-colors duration-200 hover:bg-[var(--hover)]'>
      <div className='relative h-7 overflow-hidden rounded-sm text-xs xl:text-sm'>
        <Progress
          value={Math.max(value.relativePercentage, 2)}
          className='bg-muted/30 group-hover:bg-muted/40 [&>div]:bg-primary/80 absolute bottom-0 h-1 rounded-sm transition-colors duration-200'
        />

        <div className='absolute inset-0 z-10 flex items-center justify-between px-3'>
          <div className='flex max-w-[85%] items-center gap-2 truncate'>
            {typeof index === 'number' && <span className='text-foreground font-mono font-medium'>{index}.</span>}
            {icon && <span className='flex-shrink-0'>{icon}</span>}
            <span className='text-foreground truncate font-mono font-medium'>{value.value}</span>
          </div>

          <div className='text-muted-foreground flex gap-2 font-mono'>
            <div className='opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              <div className='hidden gap-1 transition-all transition-discrete duration-200 group-hover:flex'>
                {value.comparisonValue && (
                  <span>
                    <TrendPercentage percentage={value.trendPercentage} withParenthesis />
                  </span>
                )}
                {formatPercentage(value.percentage)}
              </div>
            </div>
            <span>{value.count.toLocaleString()}</span>
            {value.comparisonValue && <TrendIndicator percentage={value.trendPercentage} />}
          </div>
        </div>
      </div>
    </div>
  );
}

<div className='flex'>
  <div>This is some text</div>
  <div className='opacity-0 transition-opacity duration-200 group-hover:opacity-100'>show on hover</div>
  <div>some icon</div>
</div>;

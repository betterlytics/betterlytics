import { formatPercentage } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';
import { TrendIndicator } from './TrendIndicator';

type PropertyValue = {
  value: string;
  count: number;
  relativePercentage: number;
  percentage: number;
  trendPercentage?: number;
};

interface PropertyValueBarProps {
  value: PropertyValue;
  icon?: React.ReactElement;
  index?: number;
}

export function PropertyValueBar({ value, icon, index }: PropertyValueBarProps) {
  return (
    <div className='group hover:bg-muted/20 relative rounded-sm transition-colors duration-200'>
      <div className='relative h-7 overflow-hidden rounded-sm text-xs xl:text-sm'>
        <Progress
          value={Math.max(value.relativePercentage, 2)}
          className='bg-muted/30 group-hover:bg-muted/40 [&>div]:bg-primary/30 h-full rounded-sm transition-colors duration-200'
        />

        <div className='absolute inset-0 z-10 flex items-center justify-between px-3'>
          <div className='flex max-w-[85%] items-center gap-2'>
            {typeof index === 'number' && <span className='text-foreground font-mono font-medium'>{index}.</span>}
            {icon && <span className='flex-shrink-0'>{icon}</span>}
            <span className='text-foreground truncate font-mono font-medium'>{value.value}</span>
          </div>

          <div className='text-muted-foreground absolute right-[12px] flex gap-2 font-mono'>
            <span className='flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              <TrendIndicator percentage={value.trendPercentage} />
              {formatPercentage(value.percentage)}
            </span>
            <span>{value.count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

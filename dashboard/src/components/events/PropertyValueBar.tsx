import { EventPropertyValue } from '@/entities/events';
import { formatPercentage } from '@/utils/formatters';
import { Progress } from '@/components/ui/progress';

interface PropertyValueBarProps {
  value: EventPropertyValue;
  icon?: React.ReactElement;
  index?: number;
}

export function PropertyValueBar({ value, icon, index }: PropertyValueBarProps) {
  return (
    <div className='group hover:bg-muted/20 relative rounded-sm transition-colors duration-200'>
      <div className='relative h-7 overflow-hidden rounded-sm'>
        <Progress
          value={Math.max(value.relativePercentage, 2)}
          className='bg-muted/30 group-hover:bg-muted/40 [&>div]:bg-primary/30 h-full rounded-sm transition-colors duration-200'
        />

        <div className='absolute inset-0 z-10 flex items-center justify-between px-3'>
          <div className='flex items-center gap-2'>
            {typeof index === 'number' && (
              <span className='text-foreground font-mono text-sm font-medium'>{index}.</span>
            )}
            {icon && <span className='flex-shrink-0'>{icon}</span>}
            <span className='text-foreground truncate font-mono text-sm font-medium'>{value.value}</span>
          </div>

          <div className='text-muted-foreground flex items-center gap-2 font-mono text-xs'>
            <span className='opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              {formatPercentage(value.percentage)}
            </span>
            <span>{value.count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { formatPercentage } from '@/utils/formatters';

type PiePayload = {
  name: string;
  value: number;
  fill?: string;
  stroke?: string;
  color?: string;
  payload?: { name?: string; percentage?: number; value?: number[]; fill?: string };
};

interface PieChartTooltipProps {
  active?: boolean;
  payload?: PiePayload[];
  labelFormatter?: (label: string) => string;
  valueFormatter?: (value: number) => string;
  title?: string;
  renderIcon?: (label: string) => React.ReactNode;
}

export function PieChartTooltip({
  active,
  payload,
  labelFormatter,
  valueFormatter,
  title,
  renderIcon,
}: PieChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const p0 = payload[0];
  const label = p0?.name || p0?.payload?.name || '';
  const color = p0?.payload?.fill || p0?.fill || p0?.color || p0?.stroke || 'hsl(var(--primary))';
  const value = typeof p0?.value === 'number' ? p0.value : 0;
  const percentage = (p0?.payload as any)?.percentage as number | undefined;

  return (
    <div
      className={cn(
        'border-border bg-popover/95 min-w-[180px] rounded-lg border p-3 shadow-xl backdrop-blur-sm',
        'animate-in fade-in-0 zoom-in-95 duration-200',
      )}
    >
      {title && <div className='text-popover-foreground mb-2 text-sm font-medium'>{title}</div>}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-1'>
          <div className='h-2 w-2 rounded-full' style={{ backgroundColor: color }} />
          {renderIcon && <span className='flex items-center'>{renderIcon(label)}</span>}
          <span className='text-popover-foreground text-sm'>{labelFormatter ? labelFormatter(label) : label}</span>
        </div>
        <div className='text-right'>
          <div className='text-popover-foreground text-sm font-medium'>
            {percentage !== undefined && (
              <span className='text-muted-foreground me-2 text-sm font-normal'>
                {formatPercentage(percentage)}
              </span>
            )}
            {valueFormatter ? valueFormatter(value) : value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PieChartTooltip;

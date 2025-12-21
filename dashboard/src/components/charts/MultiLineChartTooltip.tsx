'use client';

import { cn } from '@/lib/utils';

interface MultiLineChartTooltipProps {
  payload?: Array<{
    value: number;
    color?: string;
    dataKey?: string;
    name?: string;
    payload: { date: string | number; name?: string; label?: string; color?: string; value: number[] };
  }>;
  formatter?: (value: any) => string;
  labelFormatter: (date: any) => string;
  active?: boolean;
  label?: Date;
  className?: string;
}

export function MultiLineChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
}: MultiLineChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const name = label || payload[0].payload.name || payload[0].payload.label;

  // Extract percentile number from name (e.g., "P99" -> 99, "p50" -> 50)
  const extractPercentile = (name?: string) => {
    const match = name?.match(/p(\d+)/i);
    return match ? Number(match[1]) : 0;
  };

  // Sort by value descending, with percentile as tiebreaker (higher percentile first)
  const sorted = [...payload].sort((a, b) => {
    const valueDiff = (b.value ?? 0) - (a.value ?? 0);
    if (valueDiff !== 0) return valueDiff;
    return extractPercentile(b.name) - extractPercentile(a.name);
  });

  return (
    <div
      className={cn(
        'border-border bg-popover/95 min-w-[160px] rounded-lg border p-4 shadow-xl backdrop-blur-sm',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className,
      )}
    >
      <div className='border-border mb-3 border-b pb-2'>
        <div className='mb-1 flex items-center gap-2'>
          <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {labelFormatter(name)}
          </span>
        </div>
      </div>

      <div className='space-y-2'>
        {sorted.map((item) => {
          const labelText = item.name ?? item.dataKey;
          const valueContent = formatter ? formatter(item.value) : item.value;
          return (
            <div key={String(item.dataKey)} className='flex items-center justify-between text-sm'>
              <div className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full' style={{ background: item.color }}></span>
                <span className='text-muted-foreground'>{labelText}</span>
              </div>
              <span className='text-popover-foreground font-medium'>{valueContent}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MultiLineChartTooltip;

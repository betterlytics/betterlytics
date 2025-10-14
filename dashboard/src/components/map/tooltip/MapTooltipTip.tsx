import { cn } from '@/lib/utils';
import React from 'react';

export type MapTooltipTipProps = {
  className?: string;
  style?: React.ComponentProps<'div'>['style'];
};

function MapTooltipTipComponent({ className, style }: MapTooltipTipProps) {
  return (
    <div
      className={cn(
        'pointer-none bg-transparent',
        '-mt-[2px] h-0 w-0 self-center',
        'border-t-[10px] border-r-[8px] border-l-[8px]',
        'border-r-transparent border-l-transparent',
        'border-t-(--color-card)',
        className,
      )}
      style={{
        filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05))',
        ...style,
      }}
    />
  );
}

const MapTooltipTip = React.memo(MapTooltipTipComponent);
MapTooltipTip.displayName = 'MapTooltipTip';

export default MapTooltipTip;

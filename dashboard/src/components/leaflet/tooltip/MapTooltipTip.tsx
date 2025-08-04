import { cn } from '@/lib/utils';
import React from 'react';
export const MapTooltipTipComponent = () => (
  <div
    className={cn(
      '-mt-[2px] h-0 w-0 self-center',
      'border-t-[10px] border-r-[8px] border-l-[8px]',
      'border-t-(--color-card)',
      'border-r-transparent border-l-transparent',
    )}
    style={{
      filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.05))',
    }}
  />
);

const MapTooltipTip = React.memo(MapTooltipTipComponent);
MapTooltipTip.displayName = 'MapTooltipTip';

export default MapTooltipTip;

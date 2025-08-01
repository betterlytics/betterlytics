import { cn } from '@/lib/utils';
import React from 'react';

export const MapTooltipTipComponent = () => (
  <div
    className={cn(
      'mt-[-8px] h-0 w-0 self-center',
      'border-t-[16px] border-r-[14px] border-l-[14px]',
      'border-t-card border-r-transparent border-l-transparent',
    )}
  />
);

const MapTooltipTip = React.memo(MapTooltipTipComponent);
MapTooltipTip.displayName = 'MapTooltipTip';

export default MapTooltipTip;

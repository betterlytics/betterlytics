import React from 'react';
import MapTooltipContent from './MapTooltipContent';
import MapTooltipTip from './MapTooltipTip';
import { GeoVisitor } from '@/entities/geography';

export type MapTooltipProps = {
  geoVisitor?: GeoVisitor;
  size: 'sm' | 'lg';
};

export const MapTooltip = React.memo<MapTooltipProps>(({ geoVisitor, size }: MapTooltipProps) => {
  if (!geoVisitor) return null;

  return (
    <div
      className='mt-1 flex flex-col'
      style={{
        filter: 'drop-shadow(0 0.5px 2px var(--color-sidebar-accent-foreground))',
      }}
    >
      <MapTooltipContent {...geoVisitor} size={size} />
      <MapTooltipTip />
    </div>
  );
});

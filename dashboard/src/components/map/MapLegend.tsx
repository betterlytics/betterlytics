import { MAP_VISITOR_COLORS } from '@/constants/mapColors';
import React from 'react';

function MapLegendComponent({ maxVisitors = 1 }: { maxVisitors?: number }) {
  return (
    <div className='info-legend bg-card border-border absolute right-[1%] bottom-[1%] rounded-md border p-2.5 shadow'>
      <h4 className='text-foreground mb-1.5 font-medium'>Visitors</h4>
      <div className='flex items-center'>
        <span className='text-muted-foreground mr-1 text-xs'>0</span>
        <div
          className='h-2 w-24 rounded'
          style={{
            background: `linear-gradient(to right, ${MAP_VISITOR_COLORS.NO_VISITORS} 0%, ${MAP_VISITOR_COLORS.NO_VISITORS} 2%, ${MAP_VISITOR_COLORS.LOW_VISITORS} 3%, ${MAP_VISITOR_COLORS.HIGH_VISITORS} 100%)`,
          }}
        ></div>
        <span className='text-muted-foreground ml-1 text-xs'>{maxVisitors.toLocaleString()}</span>
      </div>
    </div>
  );
}

const MapLegend = React.memo(MapLegendComponent);
MapLegend.displayName = 'MapLegend';

export default MapLegend;

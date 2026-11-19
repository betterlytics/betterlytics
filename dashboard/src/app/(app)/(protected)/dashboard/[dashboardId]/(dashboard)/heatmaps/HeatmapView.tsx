'use client';

import { useEffect, useRef } from 'react';
import type { HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { drawHeat } from './heatCanvas';

type HeatmapViewProps = {
  width: number;
  height: number;
  points: HeatmapClickPoint[];
};

export function HeatmapView({ width, height, points }: HeatmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { width: containerWidth } = useResizeObserver(containerRef);

  useEffect(() => {
    if (canvasRef.current) drawHeat(canvasRef.current, points, width, height);
  }, [points, width, height]);

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / width) : 1;

  return (
    <div ref={containerRef} className='bg-card h-[calc(100vh-18rem)] min-h-96 overflow-auto rounded-lg border'>
      <div className='relative mx-auto' style={{ width: width * scale, height: height * scale }}>
        <div
          className='absolute top-0 left-0 origin-top-left'
          style={{ width, height, transform: `scale(${scale})` }}
        >
          <div className='bg-muted/50 absolute inset-0' />
          <canvas ref={canvasRef} className='pointer-events-none absolute inset-0 h-full w-full' />
        </div>
      </div>
    </div>
  );
}

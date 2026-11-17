'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';
import { drawHeat } from './heatCanvas';

type HeatmapViewProps = {
  width: number;
  height: number;
  points: HeatmapClickPoint[];
  background?: ReactNode;
};

export function HeatmapView({ width, height, points, background }: HeatmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
          <div className='absolute inset-0'>{background ?? <div className='bg-muted/50 h-full w-full' />}</div>
          <canvas ref={canvasRef} className='pointer-events-none absolute inset-0 h-full w-full' />
        </div>
      </div>
    </div>
  );
}

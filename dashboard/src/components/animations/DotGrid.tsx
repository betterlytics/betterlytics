'use client';

import { useRef, useEffect, useCallback } from 'react';
import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';

type Dot = {
  x: number;
  y: number;
  baseOpacity: number;
  activeOpacity: number;
  delay: number;
};

type DotGridProps = {
  color: string;
  active: boolean;
  gap?: number;
  dotRadius?: number;
  className?: string;
};

export function DotGrid({
  color,
  active,
  gap = 12,
  dotRadius = 1,
  className,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const progressRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const prefersReducedMotion = useReducedMotion();

  const buildDots = useCallback(
    (width: number, height: number): Dot[] => {
      const dots: Dot[] = [];
      const cols = Math.floor(width / gap);
      const rows = Math.floor(height / gap);
      const offsetX = (width - cols * gap) / 2 + gap / 2;
      const offsetY = (height - rows * gap) / 2 + gap / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x: offsetX + c * gap,
            y: offsetY + r * gap,
            baseOpacity: 0,
            activeOpacity: 0.3 + Math.random() * 0.7,
            delay: Math.random(),
          });
        }
      }
      return dots;
    },
    [gap]
  );

  const drawFrame = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);

      for (const dot of dotsRef.current) {
        const staggered = Math.max(
          0,
          Math.min(1, (progress - dot.delay * 0.3) / (1 - dot.delay * 0.3))
        );
        const opacity =
          dot.baseOpacity + (dot.activeOpacity - dot.baseOpacity) * staggered;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    },
    [color, dotRadius]
  );

  // Resize handling
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      sizeRef.current = { width, height };
      dotsRef.current = buildDots(width, height);
      drawFrame(progressRef.current);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [buildDots, drawFrame]);

  // Activation animation
  useEffect(() => {
    if (prefersReducedMotion) {
      progressRef.current = active ? 1 : 0;
      drawFrame(progressRef.current);
      return;
    }

    const controls = animate(progressRef.current, active ? 1 : 0, {
      duration: active ? 0.6 : 0.8,
      ease: 'easeOut',
      onUpdate: (v) => {
        progressRef.current = v;
        drawFrame(v);
      },
    });

    return () => controls.stop();
  }, [active, prefersReducedMotion, drawFrame]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

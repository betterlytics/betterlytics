'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

type Dot = {
  x: number;
  y: number;
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

const MIN_DOT_OPACITY = 0.3;
const STAGGER_SPREAD = 0.3;
const ACTIVATE_MS = 600;
const DEACTIVATE_MS = 800;

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export function DotGrid({ color, active, gap = 12, dotRadius = 1, className }: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const progressRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);
  const [initialized, setInitialized] = useState(false);
  const colorRef = useRef(color);
  colorRef.current = color;

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
            activeOpacity: MIN_DOT_OPACITY + Math.random() * (1 - MIN_DOT_OPACITY),
            delay: Math.random(),
          });
        }
      }
      return dots;
    },
    [gap],
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
        const staggered = Math.max(0, Math.min(1, (progress - dot.delay * STAGGER_SPREAD) / (1 - dot.delay * STAGGER_SPREAD)));

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = colorRef.current;
        ctx.globalAlpha = dot.activeOpacity * staggered;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    },
    [dotRadius],
  );

  useEffect(() => {
    if (active && !initialized) setInitialized(true);
  }, [active, initialized]);

  useEffect(() => {
    if (!initialized) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }

      sizeRef.current = { width, height };
      dotsRef.current = buildDots(width, height);
      drawFrame(progressRef.current);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [initialized, buildDots, drawFrame]);

  useEffect(() => {
    if (!initialized) return;

    const target = active ? 1 : 0;
    const start = progressRef.current;
    if (start === target) {
      drawFrame(target);
      return;
    }

    const duration = active ? ACTIVATE_MS : DEACTIVATE_MS;
    const startTime = performance.now();

    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      progressRef.current = start + (target - start) * easeOut(t);
      drawFrame(progressRef.current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, initialized, drawFrame]);

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className='h-full w-full' aria-hidden='true' />
    </div>
  );
}

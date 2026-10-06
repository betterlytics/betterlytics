'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';

type Star = { x: number; y: number; r: number; alpha: number; warm: boolean; hz: number; phase: number; depth: number };

const FRAME_MS = 1000 / 30; // the sky moves a few px a second; 30fps is plenty
const COOL = 'rgb(226 232 255)';
const WARM = 'rgb(255 238 216)';

/* Seeded, so the sky is the same on every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Faint stars that twinkle and drift slowly left, the nearer ones faster; still for reduced motion, paused off
 * screen. `className` must size the canvas (it fills its box) and may mask it.
 */
export function Starfield({
  className,
  perMegapixel = 150,
  drift = 4,
  brightness = 1,
}: {
  className?: string;
  /** Stars per million CSS px². */
  perMegapixel?: number;
  /** px per second for the nearest stars; 0 holds the sky still and only twinkles it. */
  drift?: number;
  /** Scales every star's opacity. */
  brightness?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(now: number) => void>(() => {});
  const onScreen = useInView(canvasRef, 'onScreen');
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let stars: Star[] = [];

    const build = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const rand = seeded(7);
      stars = Array.from({ length: Math.round(((width * height) / 1e6) * perMegapixel) }, () => {
        // most stars tiny and dim, a few a touch brighter
        const magnitude = rand();
        return {
          x: rand() * width,
          y: rand() * height,
          r: 0.35 + magnitude ** 3 * 0.8,
          alpha: (0.1 + magnitude ** 2.4 * 0.55) * brightness,
          warm: rand() < 0.12,
          hz: 0.12 + rand() * 0.35,
          phase: rand() * Math.PI * 2,
          depth: 0.25 + rand() * 0.75,
        };
      });
    };

    drawRef.current = (now) => {
      const seconds = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const x = (((star.x - seconds * drift * star.depth) % width) + width) % width;
        ctx.globalAlpha = star.alpha * (0.7 + 0.3 * Math.sin(seconds * star.hz * Math.PI * 2 + star.phase));
        ctx.fillStyle = star.warm ? WARM : COOL;
        ctx.beginPath();
        ctx.arc(x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    build();
    drawRef.current(performance.now());
    const ro = new ResizeObserver(() => {
      build();
      drawRef.current(performance.now());
    });
    ro.observe(canvas);
    return () => {
      ro.disconnect();
      drawRef.current = () => {};
    };
  }, [perMegapixel, drift, brightness]);

  useEffect(() => {
    if (!onScreen || reduce) return;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      if (now - last >= FRAME_MS) {
        last = now;
        drawRef.current(now);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduce]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

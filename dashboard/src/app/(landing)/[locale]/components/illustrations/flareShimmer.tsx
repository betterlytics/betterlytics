'use client';

import { useEffect, useRef } from 'react';
import { vars } from '@/landing/lib/cssVars';

/* Must match `.terminal::after` in agentTranscript.module.css, which reads FLARE_FIELD. */
const BOX = 620;
const PITCH = 11;
const DOT = 1.2; // radius, and offset into its tile
const FULL_PCT = 10; // mask: full strength to this % of the radius, gone by FADE_PCT
const FADE_PCT = 66;
const FULL = (FULL_PCT / 100) * (BOX / 2);
const FADE = (FADE_PCT / 100) * (BOX / 2);

export const FLARE_FIELD = vars({
  '--flare-box': `${BOX}px`,
  '--flare-pitch': `${PITCH}px`,
  '--flare-dot': `${DOT}px`,
  '--flare-full': `${FULL_PCT}%`,
  '--flare-fade': `${FADE_PCT}%`,
});

const MAX_DPR = 2;
const FIRST_WAVE_MS = 600;
const FPS = 30;
const PEAK = 0.5; // max alpha a crest adds
const WIDTH = 48; // crest half-width, px
const SPEED = 46; // px/s
const FAINT = 0.06; // alpha below which a crest doesn't show
const REST = [0, 300]; // ms between waves, random in range
const TURN = (70 / 180) * Math.PI; // min heading change between waves

type Dot = { x: number; y: number; reach: number };
type Wave = { ux: number; uy: number; from: number; to: number; start: number; duration: number };

/** Mirrors the CSS mask, so a wave never lights a hidden dot. */
function falloff(d: number) {
  return d <= FULL ? 1 : Math.max(0, 1 - (d - FULL) / (FADE - FULL));
}

/** The parent element must be the frame carrying FLARE_FIELD. */
export function FlareShimmer({ className, live }: { className?: string; live: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    const frame = canvas?.parentElement;
    if (!canvas || !ctx || !frame) return;
    if (!live) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    canvas.width = BOX * dpr;
    canvas.height = BOX * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgb(220, 226, 255)';

    let dots: Dot[] = [];
    const measure = () => {
      const c = canvas.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      const left = f.left - c.left;
      const top = f.top - c.top;
      const right = f.right - c.left;
      const bottom = f.bottom - c.top;
      dots = [];
      const n = Math.floor(BOX / PITCH);
      for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= n; j++) {
          const bx = DOT + i * PITCH;
          const by = DOT + j * PITCH;
          if (bx < left || bx > right || by < top || by > bottom) continue;
          const x = bx - BOX / 2;
          const y = by - BOX / 2;
          const reach = falloff(Math.hypot(x, y));
          if (reach > 0) dots.push({ x, y, reach });
        }
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);

    let heading = Math.random() * Math.PI * 2;
    const nextWave = (start: number): Wave => {
      heading += TURN + Math.random() * (Math.PI * 2 - 2 * TURN);
      const ux = Math.cos(heading);
      const uy = Math.sin(heading);
      // span only where the crest visibly lights some dot (its gaussian above FAINT)
      let from = Infinity;
      let to = -Infinity;
      for (const d of dots) {
        const lift = (d.reach * PEAK) / FAINT;
        if (lift <= 1) continue;
        const span = Math.sqrt(Math.log(lift)) * WIDTH;
        const p = d.x * ux + d.y * uy;
        from = Math.min(from, p - span);
        to = Math.max(to, p + span);
      }
      // no visible dots (terminal too narrow): idle and retry
      if (from > to) return { ux, uy, from: 0, to: 0, start, duration: 1000 };
      return { ux, uy, from, to, start, duration: ((to - from) / SPEED) * 1000 };
    };

    let wave = nextWave(performance.now() + FIRST_WAVE_MS);
    let raf = 0;
    let last = 0;
    let lit = false;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 1000 / FPS) return;
      last = now;
      const progress = (now - wave.start) / wave.duration;
      if (progress >= 1) {
        const rest = REST[0] + Math.random() * (REST[1] - REST[0]);
        wave = nextWave(now + rest);
      }
      if (progress < 0 || progress >= 1) {
        if (lit) ctx.clearRect(0, 0, BOX, BOX);
        lit = false;
        return;
      }
      const front = wave.from + (wave.to - wave.from) * progress;
      ctx.clearRect(0, 0, BOX, BOX);
      lit = true;
      for (const d of dots) {
        const s = (d.x * wave.ux + d.y * wave.uy - front) / WIDTH;
        const alpha = d.reach * PEAK * Math.exp(-s * s);
        if (alpha < 0.02) continue;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(d.x + BOX / 2, d.y + BOX / 2, DOT, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [live]);

  return <canvas ref={ref} className={className} aria-hidden />;
}

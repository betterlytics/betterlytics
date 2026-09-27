'use client';

import { useEffect, useRef } from 'react';

/* kept in step with `.ag::after` in landing-v2.css: the canvas sits in the same
   box as the static dot field, so its grid lands exactly on those dots */
const BOX = 620;
const PITCH = 11;
const DOT = 1.2; // radius, and the dot's offset into its tile
const FULL = 0.1 * (BOX / 2); // the field's mask: full strength out to 10% of the radius…
const FADE = 0.66 * (BOX / 2); // …fading to nothing at 66%
const FPS = 30;
const PEAK = 0.5; // the most the crest adds to a dot's alpha
const WIDTH = 48; // the crest's half-width in px (a gaussian's sigma)
const SPEED = 46; // px/s
const FAINT = 0.06; // a crest adding less alpha than this reads as no wave at all
const REST = [0, 300]; // ms between waves, picked at random in this range
const TURN = (70 / 180) * Math.PI; // each wave's heading differs from the last by at least this

type Dot = { x: number; y: number; reach: number };
type Wave = { ux: number; uy: number; from: number; to: number; start: number; duration: number };

/** The field's own falloff, so a wave never lights a dot the mask hides. */
function falloff(d: number) {
  return d <= FULL ? 1 : Math.max(0, 1 - (d - FULL) / (FADE - FULL));
}

/**
 * Sends one soft wave of light at a time across the MCP flare's dots, on top of
 * the static CSS field. Each crest crosses the part of the field the terminal
 * shows, the field rests a moment, and the next comes from a fresh random
 * heading, so it never reads as a loop or leans one way. Draws only while
 * `live`; the static field underneath is the whole picture without JS or under
 * reduced motion.
 */
export function FlareShimmer({ live }: { live: boolean }) {
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

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = BOX * dpr;
    canvas.height = BOX * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = 'rgb(220, 226, 255)';

    // the dots the terminal actually shows (most of the box is clipped by it),
    // relative to the flare's centre; a wave only has to cross these
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
      // run the crest only while it visibly lights some dot: each dot shows it out to
      // where its gaussian drops under FAINT, so the wave starts and ends softly but
      // spends no time dark on the way in or out; the dim fringe never shows it at all
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
      // nothing on show (the terminal is too narrow for the flare): idle, check again later
      if (from > to) return { ux, uy, from: 0, to: 0, start, duration: 1000 };
      return { ux, uy, from, to, start, duration: ((to - from) / SPEED) * 1000 };
    };

    let wave = nextWave(performance.now() + 600);
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

  return <canvas ref={ref} className='ag__pulse' aria-hidden />;
}

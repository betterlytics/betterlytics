'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import type { IllustrationProps } from './types';

/* Land is an ellipse model (lon, lat, rx, ry) rather than traced paths: a few
   hundred bytes instead of a world SVG, and it matches the dot motifs on the page. */
const LAND: ReadonlyArray<[number, number, number, number]> = [
  [-100, 48, 30, 20],
  [-148, 62, 15, 8],
  [-88, 15, 11, 9],
  [-42, 72, 13, 8],
  [-62, -5, 16, 14],
  [-64, -30, 10, 16],
  [14, 51, 19, 11],
  [18, 63, 10, 8],
  [14, 20, 24, 16],
  [25, -14, 14, 18],
  [45, 28, 12, 10],
  [88, 58, 52, 15],
  [106, 33, 21, 13],
  [78, 21, 10, 12],
  [108, 6, 13, 10],
  [134, -25, 17, 11],
  [172, -42, 5, 5],
  [139, 37, 4, 8],
];

/* Illustration copy is mock data, kept literal on purpose. */
const HITS: ReadonlyArray<[string, string, number, number]> = [
  ['Copenhagen, DK', 'via ChatGPT', 12.6, 55.7],
  ['New York, US', 'via Google', -74.0, 40.7],
  ['Bengaluru, IN', 'via Reddit', 77.6, 13.0],
  ['London, GB', 'via Google', -0.1, 51.5],
  ['Tokyo, JP', 'via Perplexity', 139.7, 35.7],
  ['São Paulo, BR', 'via Direct', -46.6, -23.5],
  ['Sydney, AU', 'via LinkedIn', 151.2, -33.9],
  ['Berlin, DE', 'via Google', 13.4, 52.5],
  ['Toronto, CA', 'via Newsletter', -79.4, 43.7],
  ['Amsterdam, NL', 'via Hacker News', 4.9, 52.4],
  ['Singapore', 'via Direct', 103.8, 1.35],
  ['San Francisco, US', 'via Claude', -122.4, 37.8],
  ['Paris, FR', 'via Google', 2.35, 48.9],
  ['Lagos, NG', 'via X', 3.4, 6.5],
  ['Mexico City, MX', 'via Google', -99.1, 19.4],
  ['Warsaw, PL', 'via GitHub', 21.0, 52.2],
  ['Seoul, KR', 'via Naver', 127.0, 37.6],
  ['Cape Town, ZA', 'via Direct', 18.4, -33.9],
];

function isLand(lo: number, la: number) {
  return LAND.some(([x, y, rx, ry]) => ((lo - x) / rx) ** 2 + ((la - y) / ry) ** 2 <= 1);
}

const POINTS: [number, number][] = [];
for (let la = -58; la <= 82; la += 3.4) {
  const step = 3.4 / Math.max(0.34, Math.cos((la * Math.PI) / 180));
  for (let lo = -180; lo < 180; lo += step) if (isLand(lo, la)) POINTS.push([lo, la]);
}

type Slot = { i: number; born: number };

/** Rotating dotted globe with arrival labels. Draws only while its card is active. */
export function Globe({ live }: IllustrationProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    if (!live || !cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const family = getComputedStyle(cv).fontFamily;
    let W = 0;
    let H = 0;
    let R = 0;
    let CX = 0;
    let CY = 0;
    let rot = -0.4;
    let raf = 0;
    let t0 = 0;
    let run = true;
    const slots: Slot[] = [
      { i: -1, born: 0 },
      { i: -1, born: 0 },
    ];

    const size = () => {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      W = r.width;
      H = r.height;
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = Math.min(W * 0.3, H * 0.86);
      CX = W / 2;
      CY = R + H * 0.06; // cropped at the bottom
    };
    const pos = (lo: number, la: number) => {
      const a = (lo * Math.PI) / 180 + rot;
      const b = (la * Math.PI) / 180;
      const cb = Math.cos(b);
      return { x: CX + R * cb * Math.sin(a), y: CY - R * Math.sin(b), z: cb * Math.cos(a) };
    };
    // Two label slots. A slot keeps its city while it faces the viewer and is
    // younger than 3.6s; otherwise it picks the most face-on city that isn't
    // already shown and doesn't crowd the other slot's label.
    const refresh = (el: number) => {
      for (let s = 0; s < slots.length; s++) {
        const slot = slots[s];
        const cur = slot.i >= 0 ? pos(HITS[slot.i][2], HITS[slot.i][3]) : null;
        if (cur && cur.z > 0.3 && el - slot.born < 3.6) continue;
        const other = slots[1 - s].i;
        const op = other >= 0 ? pos(HITS[other][2], HITS[other][3]) : null;
        let best = -1;
        let bz = -1;
        for (let k = 0; k < HITS.length; k++) {
          if (k === other || k === slot.i) continue;
          const q = pos(HITS[k][2], HITS[k][3]);
          if (q.z <= 0.46) continue;
          if (op && Math.abs(q.y - op.y) < 74 && Math.abs(q.x - op.x) < 250) continue;
          if (q.z > bz) {
            bz = q.z;
            best = k;
          }
        }
        if (best >= 0) {
          slot.i = best;
          slot.born = el;
        }
      }
    };
    const strokeMeridianOrParallel = (points: Array<{ x: number; y: number; z: number }>) => {
      ctx.beginPath();
      let started = false;
      for (const q of points) {
        if (q.z > 0) {
          if (started) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
          started = true;
        } else started = false;
      }
      ctx.stroke();
    };
    const frame = (ts: number) => {
      if (!run) return;
      if (!t0) t0 = ts;
      const el = (ts - t0) / 1000;
      refresh(el);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(235,232,230,.055)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, 6.284);
      ctx.stroke();
      for (let la = -60; la <= 60; la += 30) {
        const pts = [];
        for (let lo = -180; lo <= 180; lo += 4) pts.push(pos(lo, la));
        strokeMeridianOrParallel(pts);
      }
      for (let m = 0; m < 12; m++) {
        const pts = [];
        for (let la = -80; la <= 80; la += 4) pts.push(pos(m * 30 - 180, la));
        strokeMeridianOrParallel(pts);
      }
      for (const [lo, la] of POINTS) {
        const q = pos(lo, la);
        if (q.z <= 0.02) continue;
        ctx.globalAlpha = 0.14 + q.z * 0.42;
        ctx.fillStyle = '#EBE8E6';
        ctx.beginPath();
        ctx.arc(q.x, q.y, 0.85 + q.z * 0.85, 0, 6.284);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const lit = [slots[0].i, slots[1].i];
      for (let k = 0; k < HITS.length; k++) {
        const hp = pos(HITS[k][2], HITS[k][3]);
        if (hp.z <= 0.06) continue;
        const on = lit.includes(k);
        ctx.fillStyle = on ? '#A9B2FF' : '#8B97FF';
        ctx.globalAlpha = on ? 1 : 0.34 + hp.z * 0.34;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, on ? 3.6 : 2.2, 0, 6.284);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const slot of slots) {
        if (slot.i < 0) continue;
        const [city, source, lo, la] = HITS[slot.i];
        const ap = pos(lo, la);
        if (ap.z <= 0.16) continue;
        const pr = Math.min(1, (el - slot.born) / 1.5);
        if (pr < 1) {
          ctx.globalAlpha = (1 - pr) * 0.7;
          ctx.strokeStyle = '#A9B2FF';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(ap.x, ap.y, 4 + pr * 17, 0, 6.284);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.font = `12px ${family}`;
        const tw = Math.max(ctx.measureText(city).width, ctx.measureText(source).width) + 26;
        let bx = ap.x + 18;
        let by = ap.y - 46;
        if (bx + tw > W - 6) bx = ap.x - 18 - tw;
        if (by < 4) by = ap.y + 18;
        ctx.globalAlpha = Math.min(1, (el - slot.born) / 0.35);
        ctx.fillStyle = '#241F2E';
        ctx.strokeStyle = 'rgba(139,151,255,.42)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(bx, by, tw, 40, 7);
        else ctx.rect(bx, by, tw, 40);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y);
        ctx.lineTo(bx < ap.x ? bx + tw : bx, by + 20);
        ctx.stroke();
        ctx.fillStyle = '#EBE8E6';
        ctx.fillText(city, bx + 13, by + 17);
        ctx.fillStyle = '#8B97FF';
        ctx.font = `11.5px ${family}`;
        ctx.fillText(source, bx + 13, by + 32);
        ctx.globalAlpha = 1;
      }
      rot += 0.0019;
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    size();
    if (!W) return;
    const onResize = () => size();
    window.addEventListener('resize', onResize, { passive: true });
    if (reduce) frame(0);
    else raf = requestAnimationFrame(frame);
    return () => {
      run = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [live, reduce]);

  return (
    <div className='ac'>
      <canvas ref={ref} className='ac__gl' style={{ fontFamily: 'var(--mono)' }} />
    </div>
  );
}

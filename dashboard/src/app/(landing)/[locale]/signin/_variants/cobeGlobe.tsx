'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import createGlobe, { type COBEOptions, type Globe } from 'cobe';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Corners } from '@/landing/components/ui/frame';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';

type Vec3 = [number, number, number];

/* Mirrors the landing's globe (components/illustrations/globeScene): cobe's lat/lng mapping, its
   marker-anchor projection, its sphere at 80% of the canvas half-size, and its arrival marks and callout. */
const SPHERE = 0.8;
const GRID_STEP = 15;
const GRID_RES = 3;
const SETTLE_MS = 1200;
/* Mark sizes in CSS px. */
const MARK_DOT = 2.2;
const MARK_RING = 6;
const MARK_ACTIVE_DOT = 3;
const MARK_ACTIVE_RING = 8;
const PULSE_MS = 1800;
const PULSE_GROW = 14;
const MARK_FADE = 0.35; // facing cosine below which marks fade toward the limb
const DWELL_MS = 3600;
const SWAP_MS = 220; // the callout drops away, moves, and comes up beside the next city
const WELL_FACING = 0.45; // min facing cosine for a callout
const CALLOUT_INSET = 32; // px from the viewport's edges
const LABEL_DX = 14;
const LABEL_DY = 10;
const LABEL_FLIP_PX = 80; // closer than this to the top, the label drops below its marker

function toVector(lat: number, lng: number): Vec3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180 - Math.PI;
  const c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

function projector(phi: number, theta: number) {
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return ([x, y, z]: Vec3) => ({
    x: ((cp * x + sp * z) * SPHERE + 1) / 2,
    y: (1 - (sp * st * x + ct * y - cp * st * z) * SPHERE) / 2,
    depth: -sp * ct * x + st * y + cp * ct * z,
  });
}
type Project = ReturnType<typeof projector>;

const steps = (from: number, to: number) =>
  Array.from({ length: Math.round((to - from) / GRID_RES) + 1 }, (_, i) => from + i * GRID_RES);
const PARALLELS = Array.from({ length: 180 / GRID_STEP - 1 }, (_, i) =>
  steps(0, 360).map((lng) => toVector((i + 1) * GRID_STEP - 90, lng)),
);
const MERIDIANS = Array.from({ length: 360 / GRID_STEP }, (_, i) =>
  steps(-90, 90).map((lat) => toVector(lat, i * GRID_STEP)),
);

/* cobe faces longitude λ at phi = 3π/2 − λ */
export const facePhi = (lng: number) => (3 * Math.PI) / 2 - (lng * Math.PI) / 180;

export type GlobeLook = Pick<
  COBEOptions,
  | 'dark'
  | 'diffuse'
  | 'mapSamples'
  | 'mapBrightness'
  | 'mapBaseBrightness'
  | 'baseColor'
  | 'markerColor'
  | 'glowColor'
  | 'markers'
>;

/** A visit to call out; `direct` and `newsletter` sources are translated, the rest are names. */
export type Arrival = { id: string; city: string; source: string; lat: number; lng: number };

type Motion = { kind: 'spin'; radPerSecond: number } | { kind: 'sway'; amplitude: number; periodMs: number };

/* The globe's box in viewport px, read per resize. */
type Box = { left: number; top: number; size: number };

type CobeGlobeProps = {
  look: GlobeLook;
  facingLng: number;
  theta: number;
  motion: Motion;
  /** Faint meridians and parallels on the near side. */
  grid?: { color: string; alpha: number };
  /** The landing globe's live arrivals: a dot and ring per city, and the active one pinging under a cornered callout. */
  arrivals?: readonly Arrival[];
  /** The back of the planet, faint and mirrored, seen through a body the layer's blend hides (as on the landing). */
  farSide?: boolean;
  /** Must position the box (absolute or relative) and give it a square size. */
  className: string;
  layerClassName?: string;
  calloutClassName?: string;
};

function supportsWebGL() {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return gl !== null;
}

function strokeLines(ctx: CanvasRenderingContext2D, lines: Vec3[][], project: Project, size: number, far = false) {
  ctx.beginPath();
  for (const line of lines) {
    let pen = false;
    for (const v of line) {
      const p = project(v);
      if (far ? p.depth >= 0 : p.depth < 0) {
        pen = false;
        continue;
      }
      if (pen) ctx.lineTo(p.x * size, p.y * size);
      else ctx.moveTo(p.x * size, p.y * size);
      pen = true;
    }
  }
  ctx.stroke();
}

function drawMarks(
  ctx: CanvasRenderingContext2D,
  arrivals: readonly Arrival[],
  project: Project,
  activeId: string | undefined,
  dpr: number,
  size: number,
  now: number,
) {
  for (const a of arrivals) {
    const p = project(toVector(a.lat, a.lng));
    if (p.depth < 0) continue;
    const x = p.x * size;
    const y = p.y * size;
    const fade = Math.min(1, p.depth / MARK_FADE);
    const active = a.id === activeId;
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.arc(x, y, (active ? MARK_ACTIVE_DOT : MARK_DOT) * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = fade * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, (active ? MARK_ACTIVE_RING : MARK_RING) * dpr, 0, Math.PI * 2);
    ctx.stroke();
    if (active) {
      const phase = (now % PULSE_MS) / PULSE_MS;
      ctx.globalAlpha = fade * (1 - phase) * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, (MARK_ACTIVE_RING + phase * PULSE_GROW) * dpr, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

/** A cobe globe with an optional overlay (graticule, arrivals), paused off screen and stilled for reduced motion. */
export function CobeGlobe({
  look,
  facingLng,
  theta,
  motion,
  grid,
  arrivals,
  farSide = false,
  className,
  layerClassName,
  calloutClassName,
}: CobeGlobeProps) {
  const t = useTranslations('landing.illustrations.globe');
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const calloutRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<(phi: number, now: number) => void>(() => {});
  const globeRef = useRef<Globe | null>(null);
  const boxRef = useRef<Box>({ left: 0, top: 0, size: 1 });
  const onScreen = useInView(hostRef, 'onScreen');
  const reduce = useReducedMotion();
  const restPhi = facePhi(facingLng);
  const phiRef = useRef(restPhi);
  const [active, setActive] = useState<Arrival | null>(null);
  const activeRef = useRef<Arrival | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const layer = layerRef.current;
    const overlay = overlayRef.current;
    if (!host || !layer || !overlay || !supportsWebGL()) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    layer.appendChild(canvas);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    // cobe adds a <head> <style> it rewrites every frame (a document-wide style recalc); unused, so detach it
    const stylesBefore = new Set(document.head.querySelectorAll('style'));
    let globe: Globe;
    try {
      globe = createGlobe(canvas, {
        ...look,
        width: layer.clientWidth,
        height: layer.clientHeight,
        devicePixelRatio: dpr,
        phi: restPhi,
        theta,
      });
    } catch {
      layer.replaceChildren();
      return;
    }
    // the far side: half a turn round, tilted the other way, and mirrored back by CSS; faint, so 1x is enough
    const farLayer = farRef.current;
    let farGlobe: Globe | null = null;
    if (farSide && farLayer) {
      const farCanvas = document.createElement('canvas');
      farCanvas.style.cssText = 'width:100%;height:100%;display:block';
      farLayer.appendChild(farCanvas);
      farGlobe = createGlobe(farCanvas, {
        ...look,
        markers: [],
        width: layer.clientWidth,
        height: layer.clientHeight,
        devicePixelRatio: 1,
        phi: restPhi + Math.PI,
        theta: -theta,
      });
    }
    for (const s of document.head.querySelectorAll('style')) if (!stylesBefore.has(s)) s.remove();
    globeRef.current = globe;

    // a transform, not left/top, so moving it never triggers layout; snapped to device pixels, or its text goes soft
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    const placeCallout = (project: Project) => {
      const label = calloutRef.current;
      const a = activeRef.current;
      if (!label || !a) return;
      const { left, top, size } = boxRef.current;
      const p = project(toVector(a.lat, a.lng));
      const mx = p.x * size;
      const my = p.y * size;
      const w = label.offsetWidth;
      const h = label.offsetHeight;
      let x = mx + LABEL_DX;
      if (left + x + w > window.innerWidth - CALLOUT_INSET / 2) x = mx - LABEL_DX - w;
      const y = top + my < LABEL_FLIP_PX ? my + LABEL_DY : my - LABEL_DY - h;
      label.style.transform = `translate(${snap(x)}px, ${snap(y)}px)`;
    };

    const ctx = overlay.getContext('2d');
    const markColour = getComputedStyle(document.documentElement).getPropertyValue('--color-volt-soft').trim();
    drawRef.current = (phi, now) => {
      phiRef.current = phi;
      globe.update({ phi });
      farGlobe?.update({ phi: phi + Math.PI });
      if (!ctx || (!grid && !arrivals)) return;
      const size = overlay.width;
      const project = projector(phi, theta);
      ctx.clearRect(0, 0, size, size);
      if (grid) {
        ctx.lineWidth = dpr;
        ctx.strokeStyle = grid.color;
        ctx.globalAlpha = grid.alpha;
        strokeLines(ctx, MERIDIANS, project, size);
        strokeLines(ctx, PARALLELS, project, size);
        if (farSide) {
          ctx.globalAlpha = grid.alpha * 0.4;
          strokeLines(ctx, MERIDIANS, project, size, true);
          strokeLines(ctx, PARALLELS, project, size, true);
        }
      }
      if (arrivals) {
        ctx.lineWidth = dpr;
        ctx.strokeStyle = markColour;
        ctx.fillStyle = markColour;
        drawMarks(ctx, arrivals, project, activeRef.current?.id, dpr, size, now);
        placeCallout(project);
      }
      ctx.globalAlpha = 1;
    };

    const fit = () => {
      globe.update({ width: layer.clientWidth, height: layer.clientHeight });
      farGlobe?.update({ width: layer.clientWidth, height: layer.clientHeight });
      overlay.width = Math.round(layer.clientWidth * dpr);
      overlay.height = Math.round(layer.clientHeight * dpr);
      const rect = host.getBoundingClientRect();
      boxRef.current = { left: rect.left, top: rect.top, size: layer.clientWidth };
      drawRef.current(phiRef.current, performance.now());
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(layer);
    // the box can move without resizing (it is placed in viewport units)
    window.addEventListener('resize', fit);

    // cobe paints only on update and decodes its land texture late: repaint for a moment
    let settle = 0;
    const until = performance.now() + SETTLE_MS;
    const repaint = (now: number) => {
      globe.update({});
      farGlobe?.update({});
      if (now < until) settle = requestAnimationFrame(repaint);
    };
    settle = requestAnimationFrame(repaint);

    return () => {
      cancelAnimationFrame(settle);
      ro.disconnect();
      window.removeEventListener('resize', fit);
      globe.destroy();
      farGlobe?.destroy();
      farLayer?.replaceChildren();
      globeRef.current = null;
      drawRef.current = () => {};
      layer.replaceChildren();
    };
    // the look is fixed per variant; re-creating the globe on every render would be wasteful
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!globeRef.current || !onScreen || reduce) return;
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      const phi =
        motion.kind === 'spin'
          ? restPhi + (elapsed / 1000) * motion.radPerSecond
          : restPhi + Math.sin((elapsed / motion.periodMs) * Math.PI * 2) * motion.amplitude;
      drawRef.current(phi, now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [onScreen, reduce, motion, restPhi]);

  useEffect(() => {
    if (!arrivals || !globeRef.current) return;
    // the next city that faces the viewer and sits clear of the viewport's edges; else the best of the rest
    const pick = (current: Arrival | null) => {
      const project = projector(phiRef.current, theta);
      const { left, top, size } = boxRef.current;
      const start = current ? arrivals.findIndex((a) => a.id === current.id) : -1;
      let best = arrivals[0];
      let bestScore = -Infinity;
      for (let step = 1; step <= arrivals.length; step++) {
        const candidate = arrivals[(start + step) % arrivals.length];
        const p = project(toVector(candidate.lat, candidate.lng));
        const x = left + p.x * size;
        const y = top + p.y * size;
        const clear =
          x >= CALLOUT_INSET &&
          x <= window.innerWidth - CALLOUT_INSET &&
          y >= CALLOUT_INSET &&
          y <= window.innerHeight - CALLOUT_INSET;
        if (clear && p.depth >= WELL_FACING) return candidate;
        const score = p.depth + (clear ? 2 : 0);
        if (score > bestScore) {
          best = candidate;
          bestScore = score;
        }
      }
      return best;
    };
    setActive((current) => current ?? pick(null));
    setShown(true);
    if (!onScreen || reduce) return;
    let swap = 0;
    const id = window.setInterval(() => {
      setShown(false);
      swap = window.setTimeout(() => {
        setActive((current) => pick(current));
        setShown(true);
      }, SWAP_MS);
    }, DWELL_MS);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(swap);
    };
  }, [arrivals, onScreen, reduce, theta]);

  // before paint, so a new city's callout never shows a frame at the old one
  useLayoutEffect(() => {
    activeRef.current = active;
    drawRef.current(phiRef.current, performance.now());
  }, [active]);

  return (
    <div ref={hostRef} className={className} aria-hidden>
      {farSide ? (
        <div
          ref={farRef}
          className={cn(
            'absolute inset-0 -scale-x-100 opacity-28 [mask-image:radial-gradient(circle_closest-side,rgb(0_0_0/0.1)_18%,#000_76%)]',
            layerClassName,
          )}
        />
      ) : null}
      <div ref={layerRef} className={cn('absolute inset-0', layerClassName)} />
      <canvas ref={overlayRef} className='pointer-events-none absolute inset-0 size-full' />
      {arrivals ? (
        <div
          ref={calloutRef}
          className={cn(
            'pointer-events-none absolute top-0 left-0 translate-y-1.5 border border-volt-lift bg-canvas/66 px-[18px] py-3 font-mono text-label leading-[19px] whitespace-nowrap opacity-0 transition-[opacity,translate] duration-350 ease-out-expo will-change-transform data-on:translate-y-0 data-on:opacity-100',
            calloutClassName,
          )}
          data-on={shown && active ? '' : undefined}
        >
          <Corners
            persistent
            className='[--corner-edge:var(--color-volt-lift)] [--corner-fill:var(--color-canvas)]'
          />
          {active ? (
            <>
              <b className='block font-normal text-fg'>{active.city}</b>
              <span className='block text-caption text-volt-soft'>
                {t('via', {
                  source:
                    active.source === 'direct' || active.source === 'newsletter' ? t(active.source) : active.source,
                })}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

'use client';

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import createGlobe, { type COBEOptions, type Globe } from 'cobe';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Corners } from '@/landing/components/ui/frame';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import styles from './globe.module.css';

/* Mock data, kept literal on purpose, but for the generic sources (`direct`, `newsletter`), which are translated. */
const ARRIVALS = [
  { id: 'cph', city: 'Copenhagen, DK', source: 'ChatGPT', lat: 55.7, lng: 12.6 },
  { id: 'nyc', city: 'New York, US', source: 'Google', lat: 40.7, lng: -74.0 },
  { id: 'blr', city: 'Bengaluru, IN', source: 'Reddit', lat: 13.0, lng: 77.6 },
  { id: 'lon', city: 'London, GB', source: 'Google', lat: 51.5, lng: -0.1 },
  { id: 'tyo', city: 'Tokyo, JP', source: 'Perplexity', lat: 35.7, lng: 139.7 },
  { id: 'sao', city: 'São Paulo, BR', source: 'direct', lat: -23.5, lng: -46.6 },
  { id: 'syd', city: 'Sydney, AU', source: 'LinkedIn', lat: -33.9, lng: 151.2 },
  { id: 'ber', city: 'Berlin, DE', source: 'Google', lat: 52.5, lng: 13.4 },
  { id: 'yto', city: 'Toronto, CA', source: 'newsletter', lat: 43.7, lng: -79.4 },
  { id: 'ams', city: 'Amsterdam, NL', source: 'Hacker News', lat: 52.4, lng: 4.9 },
  { id: 'sin', city: 'Singapore', source: 'direct', lat: 1.35, lng: 103.8 },
  { id: 'sfo', city: 'San Francisco, US', source: 'Claude', lat: 37.8, lng: -122.4 },
  { id: 'par', city: 'Paris, FR', source: 'Google', lat: 48.9, lng: 2.35 },
  { id: 'los', city: 'Lagos, NG', source: 'X', lat: 6.5, lng: 3.4 },
  { id: 'mex', city: 'Mexico City, MX', source: 'Google', lat: 19.4, lng: -99.1 },
  { id: 'waw', city: 'Warsaw, PL', source: 'GitHub', lat: 52.2, lng: 21.0 },
  { id: 'sel', city: 'Seoul, KR', source: 'Naver', lat: 37.6, lng: 127.0 },
  { id: 'cpt', city: 'Cape Town, ZA', source: 'direct', lat: -33.9, lng: 18.4 },
] as const;

type Arrival = (typeof ARRIVALS)[number];

/* 80% volt-lift (0–1 RGB): keeps cobe's body (a tenth of it) darker than the canvas, for the lighten blend */
const LAND: [number, number, number] = [0.23, 0.29, 0.8];
const GLOW: [number, number, number] = [0, 0, 0]; // black vanishes under the lighten blend: no halo or rim

const IDLE_RAD_PER_MS = 0.000048; // ~one turn per two minutes
const DRAG_RAD_PER_PX = 1 / 200;
const FLING_MAX_RAD_PER_MS = 0.012;
const FLING_MS = 1700;
const START_YAW = 4.6; // Europe facing the viewer
const TILT = -0.1; // camera just below the equator
const ROLL = 0.26; // rad clockwise: the axis leans right
/* Mark sizes in CSS px. */
const MARK_DOT = 2.2;
const MARK_RING = 6;
const MARK_ACTIVE_DOT = 3;
const MARK_ACTIVE_RING = 8;
const PULSE_MS = 1800;
const PULSE_GROW = 14;
const MARK_FADE = 0.35; // facing cosine below which marks fade toward the limb
const DWELL_MS = 3600;
const WELL_FACING = 0.45; // min facing cosine for a callout
const CALLOUT_INSET = 32; // px; more than a marker moves in one dwell
const FACING_CHECK_EVERY = 6; // frames
const LAND_SETTLE_MS = 1000;
const MAX_DPR = 2; // phones too: at 1.5 the dots visibly soften on 2x screens
const FAR_DPR = 1; // the far side is faint enough for 1x
const LABEL_DX = 14;
const LABEL_DY = 10;
const LABEL_FLIP_PX = 80; // closer than this to the top, the label drops below its marker
const GRID_STEP = 15; // degrees
const MAJOR_ALPHA = 0.64; // 30° meridians
const MINOR_ALPHA = 0.3;
const PARALLEL_ALPHA = 0.25;
const FAR_GRID_ALPHA = 0.1;
const GRID_RES = 2; // degrees between samples
const SPHERE = 0.8; // cobe draws the sphere at 80% of the canvas half-height

const LOOK = {
  dark: 1,
  diffuse: 2.2,
  // fewer isn't cheaper: cobe tests four lattice points per pixel regardless
  mapSamples: 36000,
  mapBrightness: 1.4,
  mapBaseBrightness: 0.02,
  baseColor: LAND,
  glowColor: GLOW,
  markers: [], // drawn on the marks canvas instead
  markerColor: LAND, // required by the types; unused
} satisfies Partial<COBEOptions>;

type Vec3 = [number, number, number];
type Mat3 = [number, number, number, number, number, number, number, number, number]; // row-major

/* Mirrors cobe's lat/lng mapping so the graticule lands on its sphere. */
function toVector(lat: number, lng: number): Vec3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180 - Math.PI;
  const c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

/* Rotations in the screen frame: x right, y up, z toward the viewer. */
const rotX = (t: number): Mat3 => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
const rotY = (t: number): Mat3 => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
const rotZ = (t: number): Mat3 => [Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t), 0, 0, 0, 1];
function mul(a: Mat3, b: Mat3): Mat3 {
  const m = new Array(9).fill(0) as Mat3;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) m[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return m;
}

/* The globe yaws about the screen's vertical, not its poles; each frame that pose is decomposed into
   cobe's Rx(theta)·Ry(phi) plus a CSS roll Rz(-roll). */
type Pose = { phi: number; theta: number; roll: number };
const REST: Mat3 = mul(rotZ(-ROLL), mul(rotX(TILT), rotY(START_YAW)));
function poseAt(yaw: number): Pose {
  const m = mul(rotY(yaw - START_YAW), REST);
  return { theta: Math.asin(m[7]), phi: Math.atan2(-m[6], m[8]), roll: -Math.atan2(-m[1], m[4]) };
}

function degrees(from: number, to: number) {
  return Array.from({ length: (to - from) / GRID_RES + 1 }, (_, i) => from + i * GRID_RES);
}

const PARALLELS: Vec3[][] = Array.from({ length: Math.floor(90 / GRID_STEP) * 2 - 1 }, (_, i) => {
  const lat = (i + 1) * GRID_STEP - 90;
  return degrees(0, 360).map((lng) => toVector(lat, lng));
});
const MERIDIANS: Vec3[][] = Array.from({ length: 360 / GRID_STEP }, (_, i) =>
  degrees(-90, 90).map((lat) => toVector(lat, i * GRID_STEP)),
);
const MAJOR_MERIDIANS = MERIDIANS.filter((_, i) => i % 2 === 0);
const MINOR_MERIDIANS = MERIDIANS.filter((_, i) => i % 2 === 1);

/* cobe's marker-anchor projection; x and y are canvas fractions. The roll is CSS's, so it is left out. */
function projector({ phi, theta }: Pose) {
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  return ([x, y, z]: Vec3) => {
    const sx = cp * x + sp * z;
    const sy = sp * st * x + ct * y - cp * st * z;
    const depth = -sp * ct * x + st * y + cp * ct * z;
    return { x: (sx * SPHERE + 1) / 2, y: (1 - sy * SPHERE) / 2, front: depth >= 0, depth };
  };
}
type Project = ReturnType<typeof projector>;

function traceLines(ctx: CanvasRenderingContext2D, lines: Vec3[][], project: Project, far = false) {
  const { width, height } = ctx.canvas;
  ctx.beginPath();
  for (const line of lines) {
    let pen = false;
    for (const v of line) {
      const p = project(v);
      if (p.front === far) {
        pen = false;
        continue;
      }
      if (pen) ctx.lineTo(p.x * width, p.y * height);
      else ctx.moveTo(p.x * width, p.y * height);
      pen = true;
    }
  }
  ctx.stroke();
}

function drawGraticule(canvas: HTMLCanvasElement, project: Project, stroke: string, lineWidth: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.globalAlpha = FAR_GRID_ALPHA;
  traceLines(ctx, MERIDIANS, project, true);
  traceLines(ctx, PARALLELS, project, true);
  ctx.globalAlpha = MAJOR_ALPHA;
  traceLines(ctx, MAJOR_MERIDIANS, project);
  ctx.globalAlpha = MINOR_ALPHA;
  traceLines(ctx, MINOR_MERIDIANS, project);
  ctx.globalAlpha = PARALLEL_ALPHA;
  traceLines(ctx, PARALLELS, project);
}

/* Not cobe's markers: these allow the ring and pulse, and spare cobe's anchor elements. */
function drawMarks(
  canvas: HTMLCanvasElement,
  project: Project,
  activeId: string,
  dpr: number,
  colour: string,
  now: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = dpr;
  for (const a of ARRIVALS) {
    const p = project(toVector(a.lat, a.lng));
    if (!p.front) continue;
    const x = p.x * width;
    const y = p.y * height;
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
  ctx.globalAlpha = 1;
}

const byId = (id: string) => ARRIVALS.find((a) => a.id === id) ?? ARRIVALS[0];

/* Host layer's box and the scene's size in CSS px, read per resize (offsets ignore transforms). */
type HostBox = { left: number; top: number; size: number; width: number; height: number };

/* Rolled as CSS rolls the canvases; `depth` is the facing cosine (1 at the centre, 0 on the limb). */
function markerAt(box: HostBox, a: Arrival, project: Project, roll: number) {
  const p = project(toVector(a.lat, a.lng));
  const dx = p.x - 0.5;
  const dy = p.y - 0.5;
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  return {
    x: box.left + (0.5 + dx * cr - dy * sr) * box.size,
    y: box.top + (0.5 + dx * sr + dy * cr) * box.size,
    depth: p.depth,
    front: p.front,
  };
}

function inScene(box: HostBox, m: { x: number; y: number }, inset = 0) {
  return m.x >= inset && m.x <= box.width - inset && m.y >= inset && m.y <= box.height - inset;
}

/* Places the label beside its marker; returns whether it should show (marker facing and in the scene). */
function placeLabel(box: HostBox, label: HTMLElement, a: Arrival, project: Project, roll: number) {
  const m = markerAt(box, a, project, roll);
  const w = label.offsetWidth;
  let x = m.x + LABEL_DX;
  if (x + w > box.width) x = m.x - LABEL_DX - w;
  x = Math.max(0, Math.min(x, box.width - w));
  // a transform, not left/top, so moving it never triggers layout
  label.style.transform =
    m.y < LABEL_FLIP_PX
      ? `translate(${x}px, ${m.y + LABEL_DY}px)`
      : `translate(${x}px, ${m.y - LABEL_DY}px) translateY(-100%)`;
  return m.front && inScene(box, m);
}

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
const flingSpeed = (p: number) => Math.pow(1 - p * p, 2.5);

function supportsWebGL() {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return gl !== null;
}

/* Created outside React because cobe re-parents it into its own wrapper. */
function mountCanvas(layer: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  layer.appendChild(canvas);
  return canvas;
}

type Globes = { near: Globe; far: Globe };

function createGlobes(nearLayer: HTMLElement, farLayer: HTMLElement, dpr: number): Globes {
  const size = { width: nearLayer.clientWidth, height: nearLayer.clientHeight };
  const rest = poseAt(START_YAW);
  const farRest = poseAt(START_YAW + Math.PI);
  // cobe adds a <head> <style> it rewrites every frame (a document-wide style recalc); unused, so detach it
  const stylesBefore = new Set(document.head.querySelectorAll('style'));
  const near = createGlobe(mountCanvas(nearLayer), {
    ...LOOK,
    ...size,
    devicePixelRatio: dpr,
    phi: rest.phi,
    theta: rest.theta,
  });
  // the far hemisphere: turned 180° here and mirrored by CSS
  const far = createGlobe(mountCanvas(farLayer), {
    ...LOOK,
    ...size,
    devicePixelRatio: FAR_DPR,
    phi: farRest.phi,
    theta: farRest.theta,
  });
  for (const s of document.head.querySelectorAll('style')) if (!stylesBefore.has(s)) s.remove();
  return { near, far };
}

/** Without WebGL it falls back to a still graticule. */
export function GlobeScene() {
  const t = useTranslations('landing.illustrations.globe');
  const sceneRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const marksRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  // returns whether the active marker faces the viewer
  const renderRef = useRef<() => boolean>(() => true);
  const boxRef = useRef<HostBox>({ left: 0, top: 0, size: 1, width: 1, height: 1 });
  const loopRef = useRef(false); // the rAF loop is running and renders each frame
  const yawRef = useRef(START_YAW);
  const velRef = useRef(IDLE_RAD_PER_MS);
  const flingRef = useRef<{ v0: number; start: number } | null>(null);
  const dragRef = useRef<{ x: number; yaw: number; t: number; v: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // not `live`: it turns whenever any of it is on screen, active card or not
  const visible = useInView(hostRef, 'onScreen');
  const globesRef = useRef<Globes | null>(null);
  const [flat, setFlat] = useState(false);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Arrival>(ARRIVALS[0]);
  const activeRef = useRef(active.id);
  const [facing, setFacing] = useState(true);

  // before first paint: no empty frame, and the label is first rastered in place (moved later, its text went soft)
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const host = hostRef.current;
    const grid = gridRef.current;
    const farHost = farRef.current;
    const marks = marksRef.current;
    if (!scene || !host || !grid || !farHost || !marks) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const globes = supportsWebGL() ? createGlobes(host, farHost, dpr) : null;
    globesRef.current = globes;
    if (!globes) setFlat(true);

    // from the root: the journey frame blanks rule tokens until its pen lands, and a canvas keeps its stroke
    const tokens = getComputedStyle(document.documentElement);
    const stroke = tokens.getPropertyValue('--color-rule-22').trim();
    const markColour = tokens.getPropertyValue('--color-volt-soft').trim();
    renderRef.current = () => {
      const pose = poseAt(yawRef.current);
      const project = projector(pose);
      const roll = `translateX(-50%) rotate(${pose.roll}rad)`;
      drawGraticule(grid, project, stroke, dpr);
      grid.style.transform = roll;
      if (!globes) return false;
      globes.near.update({ phi: pose.phi, theta: pose.theta });
      host.style.transform = roll;
      marks.style.transform = roll;
      drawMarks(marks, project, activeRef.current, dpr, markColour, performance.now());
      const farPose = poseAt(yawRef.current + Math.PI);
      globes.far.update({ phi: farPose.phi, theta: farPose.theta });
      farHost.style.transform = `translateX(-50%) scaleX(-1) rotate(${farPose.roll}rad)`;
      const label = labelRef.current;
      return label ? placeLabel(boxRef.current, label, byId(activeRef.current), project, pose.roll) : true;
    };
    const fit = () => {
      const size = { width: host.clientWidth, height: host.clientHeight };
      globes?.near.update(size);
      globes?.far.update(size);
      grid.width = size.width * dpr;
      grid.height = size.height * dpr;
      marks.width = size.width * dpr;
      marks.height = size.height * dpr;
      boxRef.current = {
        left: host.offsetLeft - host.offsetWidth / 2,
        top: host.offsetTop,
        size: host.offsetWidth,
        width: scene.clientWidth,
        height: scene.clientHeight,
      };
      renderRef.current();
    };
    fit();
    // the scene too: a phone's card can change width without resizing the host
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    ro.observe(scene);
    // cobe paints only on update and its land texture decodes late; without the loop, repaint briefly
    let settle = 0;
    if (globes) {
      const until = performance.now() + LAND_SETTLE_MS;
      const repaint = (now: number) => {
        if (!loopRef.current) {
          globes.near.update({});
          globes.far.update({});
        }
        if (now < until) settle = requestAnimationFrame(repaint);
      };
      settle = requestAnimationFrame(repaint);
    }
    return () => {
      cancelAnimationFrame(settle);
      ro.disconnect();
      globes?.near.destroy();
      globes?.far.destroy();
      globesRef.current = null;
      host.replaceChildren();
      farHost.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (!globesRef.current || !visible || reduce) return;
    let raf = 0;
    let n = 0;
    let last = 0;
    loopRef.current = true;
    const frame = (ts: number) => {
      const dt = last ? Math.min(ts - last, 50) : 16;
      last = ts;
      if (!dragRef.current) {
        const fling = flingRef.current;
        if (fling) {
          const p = Math.min(1, (ts - fling.start) / FLING_MS);
          velRef.current = IDLE_RAD_PER_MS + (fling.v0 - IDLE_RAD_PER_MS) * flingSpeed(p);
          if (p >= 1) flingRef.current = null;
        }
        yawRef.current += velRef.current * dt;
      }
      const front = renderRef.current();
      if (++n % FACING_CHECK_EVERY === 0) setFacing(front);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      loopRef.current = false;
      cancelAnimationFrame(raf);
    };
  }, [visible, reduce]);

  useEffect(() => {
    if (!globesRef.current || !visible || reduce) return;
    const next = () => {
      const pose = poseAt(yawRef.current);
      const project = projector(pose);
      const box = boxRef.current;
      setActive((current) => {
        const start = ARRIVALS.findIndex((a) => a.id === current.id);
        let best: Arrival = current;
        let bestScore = -Infinity;
        for (let step = 1; step <= ARRIVALS.length; step++) {
          const candidate = ARRIVALS[(start + step) % ARRIVALS.length];
          const m = markerAt(box, candidate, project, pose.roll);
          const clear = inScene(box, m, CALLOUT_INSET);
          if (clear && m.depth >= WELL_FACING) return candidate;
          // fallback: clear of the edges first, then most central
          const score = m.depth + (clear ? 2 : 0);
          if (score > bestScore) {
            best = candidate;
            bestScore = score;
          }
        }
        return best;
      });
    };
    const id = setInterval(next, DWELL_MS);
    return () => clearInterval(id);
  }, [visible, reduce]);

  useEffect(() => {
    activeRef.current = active.id;
    setFacing(renderRef.current());
  }, [active]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!globesRef.current) return;
    dragRef.current = { x: e.clientX, yaw: yawRef.current, t: e.timeStamp, v: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const yaw = drag.yaw + (e.clientX - drag.x) * DRAG_RAD_PER_PX;
    const dt = e.timeStamp - drag.t;
    if (dt > 0) drag.v = drag.v * 0.6 + ((yaw - yawRef.current) / dt) * 0.4;
    drag.t = e.timeStamp;
    yawRef.current = yaw;
    if (!loopRef.current) renderRef.current();
  };
  const onPointerEnd = () => {
    const drag = dragRef.current;
    if (!drag) return;
    const v0 = clamp(drag.v, FLING_MAX_RAD_PER_MS);
    velRef.current = v0;
    flingRef.current = { v0, start: performance.now() };
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      data-grabbing={dragging || undefined}
      data-flat={flat || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      aria-hidden
    >
      <div ref={farRef} className={cn(styles.layer, styles.far)} />
      <canvas ref={gridRef} className={cn(styles.layer, styles.grid)} />
      <div ref={hostRef} className={cn(styles.layer, styles.globe)} />
      <canvas ref={marksRef} className={cn(styles.layer, styles.marks)} />
      <div
        ref={labelRef}
        className='pointer-events-none absolute top-0 left-0 border border-volt-lift bg-canvas/66 px-[18px] py-3 font-mono text-label leading-[19px] whitespace-nowrap opacity-0 transition-opacity duration-350 ease-out-expo will-change-transform data-on:opacity-100'
        data-on={facing || undefined}
      >
        <Corners
          persistent
          className='[--corner-edge:var(--color-volt-lift)] [--corner-fill:var(--color-canvas)]'
        />
        <b className='block font-normal text-fg'>{active.city}</b>
        <span className='block text-caption text-volt-soft'>
          {t('via', {
            source:
              active.source === 'direct' || active.source === 'newsletter' ? t(active.source) : active.source,
          })}
        </span>
      </div>
    </div>
  );
}

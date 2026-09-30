'use client';

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import createGlobe, { type COBEOptions, type Globe } from 'cobe';
import { useReducedMotion } from 'motion/react';
import { Corners } from '@/landing/components/ui/frame';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import styles from './globe.module.css';

/* Illustration copy is mock data, kept literal on purpose. */
const ARRIVALS = [
  { id: 'cph', city: 'Copenhagen, DK', via: 'via ChatGPT', lat: 55.7, lng: 12.6 },
  { id: 'nyc', city: 'New York, US', via: 'via Google', lat: 40.7, lng: -74.0 },
  { id: 'blr', city: 'Bengaluru, IN', via: 'via Reddit', lat: 13.0, lng: 77.6 },
  { id: 'lon', city: 'London, GB', via: 'via Google', lat: 51.5, lng: -0.1 },
  { id: 'tyo', city: 'Tokyo, JP', via: 'via Perplexity', lat: 35.7, lng: 139.7 },
  { id: 'sao', city: 'São Paulo, BR', via: 'via Direct', lat: -23.5, lng: -46.6 },
  { id: 'syd', city: 'Sydney, AU', via: 'via LinkedIn', lat: -33.9, lng: 151.2 },
  { id: 'ber', city: 'Berlin, DE', via: 'via Google', lat: 52.5, lng: 13.4 },
  { id: 'yto', city: 'Toronto, CA', via: 'via Newsletter', lat: 43.7, lng: -79.4 },
  { id: 'ams', city: 'Amsterdam, NL', via: 'via Hacker News', lat: 52.4, lng: 4.9 },
  { id: 'sin', city: 'Singapore', via: 'via Direct', lat: 1.35, lng: 103.8 },
  { id: 'sfo', city: 'San Francisco, US', via: 'via Claude', lat: 37.8, lng: -122.4 },
  { id: 'par', city: 'Paris, FR', via: 'via Google', lat: 48.9, lng: 2.35 },
  { id: 'los', city: 'Lagos, NG', via: 'via X', lat: 6.5, lng: 3.4 },
  { id: 'mex', city: 'Mexico City, MX', via: 'via Google', lat: 19.4, lng: -99.1 },
  { id: 'waw', city: 'Warsaw, PL', via: 'via GitHub', lat: 52.2, lng: 21.0 },
  { id: 'sel', city: 'Seoul, KR', via: 'via Naver', lat: 37.6, lng: 127.0 },
  { id: 'cpt', city: 'Cape Town, ZA', via: 'via Direct', lat: -33.9, lng: 18.4 },
] as const;

type Arrival = (typeof ARRIVALS)[number];

/* Palette, as 0–1 RGB. Land is volt-lift at 80%: cobe paints the sphere body at a tenth
   of this colour, and at 80% that body stays under the page canvas on every channel so
   the lighten blend in CSS can hide it. */
const LAND: [number, number, number] = [0.23, 0.29, 0.8];
const GLOW: [number, number, number] = [0, 0, 0]; // black never survives the lighten blend, so no halo and no rim

/* Motion. The globe turns about the screen's vertical axis, not about its own
   tilted poles, so the pole swings a little as it goes round, like a desk globe
   on a turntable. A drag sets the speed by hand and it eases back to idle. */
const IDLE_RAD_PER_MS = 0.000048; // one turn in roughly two minutes
const DRAG_RAD_PER_PX = 1 / 200; // pointer drag sensitivity
const FLING_MAX_RAD_PER_MS = 0.012; // the fastest a release may leave the globe spinning
const FLING_MS = 1700; // how long a fling takes to settle back to idle
const START_YAW = 4.6; // Europe facing the viewer at first paint
const TILT = -0.1; // camera a touch below the equator, so the north pole sits just behind the top limb
const ROLL = 0.26; // radians clockwise: the axis leans right, so the meridians converge off the top-right edge
/* Visitor marks, in CSS px: a filled dot inside a thin ring, and a sonar pulse on the active one. */
const MARK_DOT = 2.2;
const MARK_RING = 6;
const MARK_ACTIVE_DOT = 3;
const MARK_ACTIVE_RING = 8;
const PULSE_MS = 1800;
const PULSE_GROW = 14; // how far the pulse ring travels before it fades out
const MARK_FADE = 0.35; // cosine to the viewer below which a mark starts fading toward the limb
const DWELL_MS = 3600;
const WELL_FACING = 0.45; // cosine to the viewer; a callout is only picked this far in from the limb
const FACING_CHECK_EVERY = 6; // frames
const LAND_SETTLE_MS = 1000; // how long a still globe keeps repainting after creation, for its land texture to land
const MAX_DPR = 2; // phones included: at 1.5 the dots visibly soften on 2x screens
const FAR_DPR = 1; // the far side is faint, so it is rendered at 1x whatever the screen
const LABEL_DX = 14; // label offset from its marker, CSS px
const LABEL_DY = 10;
const LABEL_FLIP_PX = 80; // labels this close to the top of the card drop below their marker instead
const GRID_STEP = 15; // degrees between graticule lines
const MAJOR_ALPHA = 0.64; // the 30° meridians, eased back from the raw rule token
const MINOR_ALPHA = 0.3; // parallels and every other meridian are much fainter, so the 30° meridians read as the frame
const FAR_GRID_ALPHA = 0.1; // the far hemisphere's lines, seen through the sphere
const GRID_RES = 2; // degrees between samples along each line
const SPHERE = 0.8; // cobe draws the sphere at 80% of the canvas half-height

/* The look both renders share; each adds its size, pixel ratio and orientation. */
const LOOK = {
  dark: 1,
  diffuse: 2.2, // dots fall off toward the limb instead of staying flat across the disc
  // finer, denser dots; fewer would not be cheaper on small screens, since cobe tests a fixed
  // four lattice points per pixel whatever the count
  mapSamples: 36000,
  mapBrightness: 1.4, // full volt-lift at the centre of the disc, dimming from there
  mapBaseBrightness: 0.02,
  baseColor: LAND,
  glowColor: GLOW,
  markers: [], // visitors are drawn on the marks canvas instead
  markerColor: LAND, // required by the types, unused with no markers
} satisfies Partial<COBEOptions>;

type Vec3 = [number, number, number];
type Mat3 = [number, number, number, number, number, number, number, number, number]; // row-major

/* cobe's own mapping from a location to a point on its unit sphere, mirrored so
   the graticule lands on the same sphere as the land dots and markers. */
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

/* cobe orients its sphere as Rx(theta)·Ry(phi), and the page rolls the canvas by
   Rz(-roll) on top. That triple can express any orientation, so the globe's true
   orientation, a yaw about the screen's vertical axis applied to the resting pose,
   is decomposed back into the three each frame. */
type Pose = { phi: number; theta: number; roll: number };
const REST: Mat3 = mul(rotZ(-ROLL), mul(rotX(TILT), rotY(START_YAW)));
function poseAt(yaw: number): Pose {
  const m = mul(rotY(yaw - START_YAW), REST);
  return { theta: Math.asin(m[7]), phi: Math.atan2(-m[6], m[8]), roll: -Math.atan2(-m[1], m[4]) };
}

/* Every GRID_RES degrees from `from` to `to`, both ends included. */
function degrees(from: number, to: number) {
  return Array.from({ length: (to - from) / GRID_RES + 1 }, (_, i) => from + i * GRID_RES);
}

/* Parallels and meridians as unit vectors. Only the rotation changes per frame. */
const PARALLELS: Vec3[][] = Array.from({ length: Math.floor(90 / GRID_STEP) * 2 - 1 }, (_, i) => {
  const lat = (i + 1) * GRID_STEP - 90;
  return degrees(0, 360).map((lng) => toVector(lat, lng));
});
const MERIDIANS: Vec3[][] = Array.from({ length: 360 / GRID_STEP }, (_, i) =>
  degrees(-90, 90).map((lat) => toVector(lat, i * GRID_STEP)),
);
const MAJOR_MERIDIANS = MERIDIANS.filter((_, i) => i % 2 === 0);
const MINOR_LINES = [...PARALLELS, ...MERIDIANS.filter((_, i) => i % 2 === 1)];

/* The orthographic projection cobe uses for its marker anchors: spin by phi, tilt
   by theta, then x and y are fractions of the canvas. depth points at the viewer.
   The roll is applied by CSS to the whole canvas, so it is not part of this. Built
   once per pose, so the trig runs once a frame rather than once per point. */
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

/* Strokes the parts of the lines on one hemisphere: the near side by default, the far side if asked. */
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

/* Redraws the graticule for one pose: the far hemisphere faintly first, then the near one. */
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
  traceLines(ctx, MINOR_LINES, project);
}

/* Draws the visitor marks for one pose on the canvas above the globe. cobe's own markers
   are not used: drawing them here allows the ring and the pulse, and keeps cobe from
   maintaining anchor elements for them. */
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

/* Cosine between a location and the viewer: 1 at the disc centre, 0 on the limb. */
function facingDepth(a: Arrival, project: Project) {
  return project(toVector(a.lat, a.lng)).depth;
}

/* The globe layer's box inside the scene, in CSS px, read once per resize: its offsets
   ignore transforms, which makes it the frame to place the label in. */
type HostBox = { left: number; top: number; size: number };

/* Pins the label beside its marker, rolling the projected point around the host's
   centre the way CSS rolls the canvases. Returns whether the marker faces the viewer. */
function placeLabel(box: HostBox, label: HTMLElement, a: Arrival, project: Project, roll: number) {
  const p = project(toVector(a.lat, a.lng));
  const dx = p.x - 0.5;
  const dy = p.y - 0.5;
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const x = box.left + (0.5 + dx * cr - dy * sr) * box.size + LABEL_DX;
  const y = box.top + (0.5 + dx * sr + dy * cr) * box.size;
  // Above and to the right of the marker, unless that would run off the top of the card.
  // A transform rather than left/top, so moving the label never triggers layout.
  label.style.transform =
    y < LABEL_FLIP_PX
      ? `translate(${x}px, ${y + LABEL_DY}px)`
      : `translate(${x}px, ${y - LABEL_DY}px) translateY(-100%)`;
  return p.front;
}

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
/* Fling speed over its normalised time: holds near full speed at first, drops quickly
   through the middle, then fades out along a soft tail rather than stopping dead. */
const flingSpeed = (p: number) => Math.pow(1 - p * p, 2.5);

/** Whether the browser hands out WebGL at all: it can be missing, switched off or blocked. */
function supportsWebGL() {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return gl !== null;
}

/* A canvas filling its layer, for cobe to draw into. Created here rather than by React
   because cobe re-parents it into a wrapper of its own. */
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
  // cobe appends a <style> to <head> for marker anchors and rewrites its text every frame,
  // which forces a document-wide style recalculation each time. Nothing here uses it, so
  // it is detached right after creation: cobe keeps writing to it, harmlessly.
  const stylesBefore = new Set(document.head.querySelectorAll('style'));
  const near = createGlobe(mountCanvas(nearLayer), {
    ...LOOK,
    ...size,
    devicePixelRatio: dpr,
    phi: rest.phi,
    theta: rest.theta,
  });
  // The far hemisphere is the same globe seen from behind, so a second, cheaper render
  // turned half a circle round and mirrored by CSS shows it faintly through the sphere.
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

/**
 * The spinning globe: a WebGL sphere of land dots over a graticule, with visitors'
 * arrivals marked on top. One arrival at a time is called out with a label beside
 * its marker, always picked from the cities currently facing the viewer. Without
 * WebGL it falls back to the graticule alone, still, rather than breaking the page.
 */
export function GlobeScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const marksRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  // Redraws globe, graticule and label for the current yaw; returns whether the active marker faces the viewer.
  const renderRef = useRef<() => boolean>(() => true);
  const loopRef = useRef(false); // whether the animation loop is running and will render for us
  const yawRef = useRef(START_YAW);
  const velRef = useRef(IDLE_RAD_PER_MS);
  const flingRef = useRef<{ v0: number; start: number } | null>(null);
  const dragRef = useRef<{ x: number; yaw: number; t: number; v: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  // Its own check, not `live`: the globe turns whenever any of it shows, active card or not, and only then.
  const visible = useInView(hostRef, 'onScreen');
  const globesRef = useRef<Globes | null>(null);
  const [flat, setFlat] = useState(false);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Arrival>(ARRIVALS[0]);
  const activeRef = useRef(active.id);
  const [facing, setFacing] = useState(true);

  // Built and drawn before the first paint, so the scene never shows a frame with an empty
  // globe and the label parked in its corner. The label's layer is then first rastered where
  // it sits, which keeps its text sharp; rastered in the corner and then moved, it came out
  // soft on some loads.
  useLayoutEffect(() => {
    const host = hostRef.current;
    const grid = gridRef.current;
    const farHost = farRef.current;
    const marks = marksRef.current;
    if (!host || !grid || !farHost || !marks) return;

    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const globes = supportsWebGL() ? createGlobes(host, farHost, dpr) : null;
    globesRef.current = globes;
    if (!globes) setFlat(true);

    // The graticule is stroked in the page's rule-22 hairline and the marks in the arrival
    // accent, both read from the root: inside the journey frame the rule tokens stay blank
    // until its pen lands, and a colour read there before then would leave the lines unseen
    // for good, since the canvas keeps what it was stroked with.
    const tokens = getComputedStyle(document.documentElement);
    const stroke = tokens.getPropertyValue('--color-rule-22').trim();
    const markColour = tokens.getPropertyValue('--color-volt-soft').trim();
    let box: HostBox = { left: 0, top: 0, size: 1 };
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
      return label ? placeLabel(box, label, byId(activeRef.current), project, pose.roll) : true;
    };
    const fit = () => {
      const size = { width: host.clientWidth, height: host.clientHeight };
      globes?.near.update(size);
      globes?.far.update(size);
      grid.width = size.width * dpr;
      grid.height = size.height * dpr;
      marks.width = size.width * dpr;
      marks.height = size.height * dpr;
      box = { left: host.offsetLeft - host.offsetWidth / 2, top: host.offsetTop, size: host.offsetWidth };
      renderRef.current();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    // cobe paints only when updated, and its land texture decodes a moment after the globe is
    // created. The loop picks it up on its next frame; a globe that is not turning (reduced
    // motion) repaints for a moment instead, or it would keep its landless first paint.
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

  // The loop pauses off screen and under reduced motion; the last frame stays. While the
  // pointer holds the globe the yaw is the pointer's; otherwise it coasts and eases to idle.
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

  // Call out a new arrival every few seconds: the next in the list that sits well inside
  // the disc, or failing that whichever is nearest the centre, so the callout never lands
  // on a city about to slip round the limb.
  useEffect(() => {
    if (!globesRef.current || !visible || reduce) return;
    const next = () => {
      const project = projector(poseAt(yawRef.current));
      setActive((current) => {
        const start = ARRIVALS.findIndex((a) => a.id === current.id);
        let best: Arrival = current;
        let bestDepth = -1;
        for (let step = 1; step <= ARRIVALS.length; step++) {
          const candidate = ARRIVALS[(start + step) % ARRIVALS.length];
          const depth = facingDepth(candidate, project);
          if (depth >= WELL_FACING) return candidate;
          if (depth > bestDepth) {
            best = candidate;
            bestDepth = depth;
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

  // Dragging: the pointer owns the yaw and its speed is measured, so a release flings.
  // Nothing is drawn here while the loop runs; it picks the new yaw up on the next frame.
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
      {/* Placed beside its marker from the same projection that draws the graticule, and
          faded as the marker turns away from the viewer. Its fill is the canvas at two thirds,
          so land dots read through it instead of a black hole. */}
      <div
        ref={labelRef}
        className='pointer-events-none absolute top-0 left-0 border border-volt-lift bg-canvas/66 px-[18px] py-3 font-mono text-label leading-[19px] whitespace-nowrap opacity-0 transition-opacity duration-350 ease-out-expo will-change-transform data-on:opacity-100'
        data-on={facing || undefined}
      >
        {/* the corner squares in the label's own blue, kept on phones too */}
        <Corners
          persistent
          className='[--corner-edge:var(--color-volt-lift)] [--corner-fill:var(--color-canvas)]'
        />
        <b className='block font-normal text-fg'>{active.city}</b>
        <span className='block text-caption text-volt-soft'>{active.via}</span>
      </div>
    </div>
  );
}

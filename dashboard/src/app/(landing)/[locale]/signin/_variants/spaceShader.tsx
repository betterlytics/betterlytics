'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';

const FRAME_MS = 1000 / 30; // everything in the scene moves slowly; 30fps is plenty
const MAX_DPR = 1.5; // the glows are soft, and the stars are drawn wide enough to stay round at 1.5
const HORIZON_UNIT = 0.25; // of the width: a horizon's glows sized as for a planet a quarter of the page across

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

/*
 * Screened over the card, so black leaves what is under it untouched. Everything is in device px with the origin at the
 * top left; the planet is a circle (uCenter, uRadius) read from the page, and the sun sits just behind its top limb.
 */
const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uUnit; // px per unit of glow: the radius for a planet in view, a fixed width for a horizon
uniform float uDpr;
uniform float uBody; // 1 when nothing covers the planet, so its night side and blue limb are drawn here
uniform vec3 uBase; // the page colour the light is screened over (sRGB); black on a card
uniform float uSpace; // 1 draws deep space (its colour, nebula and stars); 0 leaves the page colour bare
uniform vec2 uSun; // unit vector from the planet to the sun, which sits just behind that point of the limb
uniform float uSeeThrough; // 1 when the planet is see-through: its air and the light behind it carry on across it

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

/* One star per lit cell, at a random spot in it: a small gaussian that twinkles. Two layers of cell sizes. */
vec3 stars(vec2 px) {
  vec3 c = vec3(0.0);
  for (int l = 0; l < 2; l++) {
    float cell = (l == 0 ? 74.0 : 38.0) * uDpr;
    vec2 g = px / cell;
    vec2 id = floor(g) + float(l) * 31.0;
    if (hash(id) < (l == 0 ? 0.72 : 0.86)) continue;
    vec2 at = (vec2(hash(id + 3.1), hash(id + 7.7)) * 0.8 + 0.1 + floor(g)) * cell;
    float d = length(px - at) / uDpr;
    float size = 0.55 + 0.9 * pow(hash(id + 1.3), 5.0);
    float twinkle = 0.85 + 0.15 * sin(uTime * (0.5 + 1.3 * hash(id + 9.0)) + hash(id) * 40.0);
    float b = exp(-d * d / (size * size)) * twinkle * (0.25 + 0.75 * pow(hash(id + 5.0), 3.0));
    c += b * mix(vec3(0.72, 0.8, 1.0), vec3(1.0, 0.9, 0.78), step(0.86, hash(id + 2.0)));
  }
  return c;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 d = px - uCenter;
  float r = length(d) / uRadius;
  vec2 n = d / max(length(d), 1e-3);
  vec2 uv = px / uRes.y;
  float outside = smoothstep(1.0, 1.0 + 1.5 * uDpr / uRadius, r);
  // what the planet hides: everything behind it, unless it is see-through
  float unhidden = mix(outside, 1.0, uSeeThrough);

  // deep space, lifted a little toward the planet's light
  vec3 col = (1.0 - uBody) * uSpace * mix(vec3(0.0006, 0.0008, 0.003), vec3(0.0009, 0.0014, 0.005), exp(-max(r - 1.0, 0.0) / 0.6)) * outside;

  // nebula: domain-warped fbm, drifting very slowly
  vec2 q = uv * 1.9 + vec2(uTime * 0.0025, -uTime * 0.002);
  vec2 w = vec2(fbm(q + vec2(0.0, uTime * 0.006)), fbm(q + vec2(5.2, 1.3)));
  float neb = smoothstep(0.42, 1.0, fbm(q + 2.4 * w));
  // a whole page of sky holds more nebula than a card, so a horizon gets half as much
  col += neb * mix(vec3(0.0025, 0.004, 0.02), vec3(0.007, 0.004, 0.017), w.x) * outside * mix(1.0, 0.5, uBody) * uSpace;

  col += stars(px) * outside * 0.32 * uSpace;

  // atmosphere: a thin bright shell and a wide faint halo, both lit from the sun above
  float lit = pow(clamp(dot(n, uSun) * 0.5 + 0.5, 0.0, 1.0), 2.4);
  // a see-through planet's air is a ring either side of its edge; a solid one only shows outside it
  float h = mix(max(length(d) - uRadius, 0.0), abs(length(d) - uRadius), uSeeThrough) / uUnit;
  float shell = exp(-h / mix(0.028, 0.016, uSeeThrough)) * unhidden;
  float halo = exp(-h / 0.12) * unhidden;
  vec3 atmos = vec3(0.1, 0.18, 0.9) * shell * (0.06 + 0.6 * lit) + vec3(0.02, 0.03, 0.13) * halo * (0.02 + 0.13 * lit);
  // seen through the planet's edge from inside: a thin band of scattered light
  float depth = max(uRadius - length(d), 0.0) / uUnit;
  atmos += vec3(0.25, 0.34, 1.0) * (1.0 - outside) * exp(-depth / 0.018) * (0.04 + 0.38 * lit) * (1.0 - uSeeThrough);

  vec2 s = (px - (uCenter + uSun * (uRadius + 0.005 * uUnit))) / uUnit;
  // the sun's frame: along the limb, and out from it
  s = vec2(s.x * -uSun.y + s.y * uSun.x, s.x * uSun.x + s.y * uSun.y);
  // the night side: near-black, its air lit blue toward the horizon, brightest under the sun
  float underSun = exp(-abs(s.x) / 0.24);
  vec3 body = mix(vec3(0.0006, 0.0008, 0.005), vec3(0.018, 0.032, 0.25), exp(-depth / 0.09) * (0.3 + 0.7 * underSun));
  col += body * (1.0 - outside) * uBody;
  atmos *= mix(1.0, 0.45 + 0.75 * underSun, uBody);
  // a see-through planet shows its air on both sides of the edge, and sits on a calm page: both quieter
  col += atmos * mix(1.0, 0.1, uSeeThrough);

  // the sun, just behind the top limb: forward scattering around it, hidden by the planet, and a faint streak
  float sd = length(s * vec2(0.42, 1.0));
  float sun = (exp(-sd / 0.036) * 0.26 + exp(-sd / 0.18) * 0.06) * unhidden;
  float streak = exp(-abs(s.y) / 0.005) * exp(-abs(s.x) / 0.38) * 0.035 * unhidden;
  col += (vec3(1.0, 0.84, 0.62) * sun + vec3(0.7, 0.78, 1.0) * streak) * mix(1.0, 0.15, uSeeThrough);

  // filmic tone map, then sRGB, then dither so the long gradients never band
  col = clamp((col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14), 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));
  col = 1.0 - (1.0 - uBase) * (1.0 - col);
  col += (hash(px + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* --color-canvas as 0–1 sRGB, read through a probe so any CSS colour syntax resolves to rgb() */
function canvasColour(): [number, number, number] {
  const probe = document.createElement('i');
  probe.style.color = 'var(--color-canvas)';
  document.body.appendChild(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** A planet given in the canvas's own terms: its limb's top at `top` of the height, its radius `radius` widths. */
export type Horizon = { top: number; radius: number };

/**
 * Deep space around a planet, drawn by a fragment shader: nebula, stars, the atmosphere and the sun behind the limb.
 * By default it is screened over a card and follows the card's `[data-planet]` element; given a `horizon`, it draws
 * the planet itself, centred and set mostly below the canvas, as the sky of a whole page.
 */
export function SpaceShader({
  className,
  horizon,
  space = true,
  sun = [0, -1],
  seeThrough = false,
}: {
  className?: string;
  horizon?: Horizon;
  /** false: no space colour, nebula or stars, only the planet's air and the sun, over the page's own colour. */
  space?: boolean;
  /** Direction from the planet to the sun, in screen terms (y down). */
  sun?: [number, number];
  /** The planet hides nothing: for a globe whose body is blended away, its air and the light run on across it. */
  seeThrough?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(now: number) => void>(() => {});
  const onScreen = useInView(canvasRef, 'onScreen');
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    const planet = horizon ? null : canvas?.parentElement?.querySelector<HTMLElement>('[data-planet]');
    if (!canvas || !gl || (!horizon && !planet)) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const u = {
      res: gl.getUniformLocation(program, 'uRes'),
      time: gl.getUniformLocation(program, 'uTime'),
      center: gl.getUniformLocation(program, 'uCenter'),
      radius: gl.getUniformLocation(program, 'uRadius'),
      dpr: gl.getUniformLocation(program, 'uDpr'),
      body: gl.getUniformLocation(program, 'uBody'),
      unit: gl.getUniformLocation(program, 'uUnit'),
      base: gl.getUniformLocation(program, 'uBase'),
      space: gl.getUniformLocation(program, 'uSpace'),
      sun: gl.getUniformLocation(program, 'uSun'),
      seeThrough: gl.getUniformLocation(program, 'uSeeThrough'),
    };
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    // a page's sky is the page itself: the landing's canvas colour, so it matches the plain pages exactly
    // over a card it is screened, so black; as a page's own sky, the page's colour
    const base = horizon || !space ? canvasColour() : [0, 0, 0];
    const sunLength = Math.hypot(sun[0], sun[1]) || 1;

    const fit = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    drawRef.current = (now) => {
      const { width, height } = canvas;
      if (horizon) {
        const radius = horizon.radius * width;
        gl.uniform2f(u.center, width / 2, horizon.top * height + radius);
        gl.uniform1f(u.radius, radius);
        gl.uniform1f(u.unit, HORIZON_UNIT * width);
      } else if (planet) {
        // read every frame: the planet rises in on arrival
        const box = canvas.getBoundingClientRect();
        const disc = planet.getBoundingClientRect();
        gl.uniform2f(u.center, (disc.left + disc.width / 2 - box.left) * dpr, (disc.top + disc.height / 2 - box.top) * dpr);
        gl.uniform1f(u.radius, (disc.width / 2) * dpr);
        gl.uniform1f(u.unit, (disc.width / 2) * dpr);
      }
      gl.uniform2f(u.res, width, height);
      gl.uniform1f(u.time, now / 1000);
      gl.uniform1f(u.dpr, dpr);
      gl.uniform1f(u.body, horizon ? 1 : 0);
      gl.uniform3f(u.base, base[0], base[1], base[2]);
      gl.uniform1f(u.space, space ? 1 : 0);
      gl.uniform2f(u.sun, sun[0] / sunLength, sun[1] / sunLength);
      gl.uniform1f(u.seeThrough, seeThrough ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    drawRef.current(performance.now());

    return () => {
      ro.disconnect();
      drawRef.current = () => {};
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
    // the horizon is fixed per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!onScreen) return;
    if (reduce) {
      // one still frame, once the planet has settled
      const id = window.setTimeout(() => drawRef.current(0), 1600);
      return () => window.clearTimeout(id);
    }
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

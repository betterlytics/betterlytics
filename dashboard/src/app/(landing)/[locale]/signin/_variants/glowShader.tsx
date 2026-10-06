'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { useInView } from '@/landing/hooks/useInView';

const FRAME_MS = 1000 / 30; // the light moves over seconds; 30fps is plenty
const MAX_DPR = 2; // the hatch is 1px lines: they need the full density to stay crisp

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

/*
 * C2's lamp (horizon.module.css, .root[data-tone='volt'] .glow and .hatch), computed per pixel: the same ellipse below
 * the bottom edge, the same colour stops composited over the canvas in sRGB as CSS does, and the same breathing. On top
 * of that, what CSS can't do: the light's edge ripples slowly, faint curtains drift through the blue, the hatch is
 * anti-aliased per pixel, and the result is dithered so the long gradient never bands. Coordinates in device px, origin
 * top left.
 */
const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uDpr;
uniform vec3 uBase;

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
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.0;
    a *= 0.5;
  }
  return v;
}

/* C2's stops, as premultiplied-free rgba over the canvas */
vec4 lamp(float t) {
  vec4 c0 = vec4(255.0, 246.0, 224.0, 0.95 * 255.0) / 255.0;
  vec4 c1 = vec4(255.0, 236.0, 206.0, 0.80 * 255.0) / 255.0;
  vec4 c2 = vec4(186.0, 194.0, 255.0, 0.74 * 255.0) / 255.0;
  vec4 c3 = vec4(84.0, 102.0, 255.0, 0.84 * 255.0) / 255.0;
  vec4 c4 = vec4(34.0, 51.0, 228.0, 0.80 * 255.0) / 255.0;
  vec4 c5 = vec4(26.0, 43.0, 209.0, 0.50 * 255.0) / 255.0;
  vec4 c6 = vec4(26.0, 43.0, 209.0, 0.0) / 255.0;
  if (t < 0.13) return mix(c0, c1, t / 0.13);
  if (t < 0.27) return mix(c1, c2, (t - 0.13) / 0.14);
  if (t < 0.42) return mix(c2, c3, (t - 0.27) / 0.15);
  if (t < 0.58) return mix(c3, c4, (t - 0.42) / 0.16);
  if (t < 0.77) return mix(c4, c5, (t - 0.58) / 0.19);
  if (t < 1.0) return mix(c5, c6, (t - 0.77) / 0.23);
  return c6;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 css = px / uDpr;
  vec2 size = uRes / uDpr;

  // breathing, as C2's 10s alternate ease-in-out: wider and a little fainter at the top of the breath
  float breath = 0.5 - 0.5 * cos(uTime * 3.14159265 / 10.0);
  vec2 radii = vec2(max(800.0, 0.75 * size.x), 0.46 * size.y) * mix(vec2(1.0), vec2(1.06, 1.1), breath);
  vec2 centre = vec2(0.5 * size.x, 1.06 * size.y);
  vec2 e = (css - centre) / radii;
  float t = length(e);

  // the edge of the light ripples slowly, like the top of an atmosphere
  float drift = fbm(vec2(css.x / 260.0 + uTime * 0.03, uTime * 0.02)) - 0.5;
  t += drift * 0.05 * smoothstep(0.35, 0.95, t);

  vec4 light = lamp(clamp(t, 0.0, 1.0));
  light.a *= mix(1.0, 0.88, breath);

  // faint curtains drifting through the blue band
  float band = smoothstep(0.38, 0.6, t) * (1.0 - smoothstep(0.78, 1.0, t));
  float curtain = fbm(vec2(css.x / 120.0 - uTime * 0.025, t * 3.0 + uTime * 0.01));
  light.a *= 1.0 + band * (curtain - 0.5) * 0.45;
  light.a = clamp(light.a, 0.0, 1.0);

  vec3 col = mix(uBase, light.rgb, light.a);

  // the hatch: 1px lines every 7.07px at 315deg, where the light reaches (C2's mask, per pixel)
  float d = fract((css.x + css.y) / (sqrt(2.0) * 7.0711)) * 7.0711;
  float line = clamp(1.0 - d, 0.0, 1.0);
  vec2 m = (css - vec2(0.5 * size.x, 1.04 * size.y)) / vec2(0.75 * size.x, 0.46 * size.y);
  float mt = length(m);
  float mask = mt < 0.46 ? mix(1.0, 0.55, mt / 0.46) : mix(0.55, 0.0, clamp((mt - 0.46) / 0.32, 0.0, 1.0));
  col = mix(col, vec3(242.0, 245.0, 255.0) / 255.0, line * 0.11 * mask);

  col += (hash(px + fract(uTime)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

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

/* --color-canvas as 0–1 sRGB, read through a probe so any CSS colour syntax resolves to rgb() */
function canvasColour(): [number, number, number] {
  const probe = document.createElement('i');
  probe.style.color = 'var(--color-canvas)';
  document.body.appendChild(probe);
  const [r = 0, g = 0, b = 0] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number);
  probe.remove();
  return [r / 255, g / 255, b / 255];
}

/** C2's lamp drawn by a fragment shader, as the whole sky of a page: it paints the canvas colour too. */
export function GlowShader({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(now: number) => void>(() => {});
  const onScreen = useInView(canvasRef, 'onScreen');
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!canvas || !gl) return;

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
      dpr: gl.getUniformLocation(program, 'uDpr'),
      base: gl.getUniformLocation(program, 'uBase'),
    };
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const base = canvasColour();

    const fit = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    fit();
    const ro = new ResizeObserver(() => {
      fit();
      drawRef.current(performance.now());
    });
    ro.observe(canvas);

    drawRef.current = (now) => {
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, now / 1000);
      gl.uniform1f(u.dpr, dpr);
      gl.uniform3f(u.base, base[0], base[1], base[2]);
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
  }, []);

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

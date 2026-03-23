'use client';

import { useEffect, useRef } from 'react';

const vertexSrc =
  '#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}';

const fragmentSrc = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform float uAmplitude;
uniform vec3 uBgColor;

// 2D noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(
    mix(hash(i),hash(i+vec2(1,0)),f.x),
    mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),
    f.y
  );
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for(int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0;
    a *= 0.5;
  }
  return v;
}

// ACES tonemapping
vec3 aces(vec3 x) {
  return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
}

// A single aurora ribbon — defined as a 1D curve with vertical glow
float ribbon(vec2 uv, float ribbonY, float thickness, float sharpness) {
  float dist = uv.y - ribbonY;
  // Sharp bright edge at the ribbon line, soft falloff below
  float bright = exp(-abs(dist) * sharpness);
  // Longer trailing glow downward
  float trail = smoothstep(0.0, -thickness, dist) * smoothstep(-thickness, -thickness * 0.3, dist);
  return bright * 0.6 + trail * 0.4;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5*uResolution) / uResolution.y;
  // Three timescales
  float Tslow = uTime * 0.06;   // overall shape drift
  float Tmed  = uTime * 0.18;   // curtain sway
  float Tfast = uTime * 0.5;    // brightness ripples

  // Top cutoff — never bleeds into title area
  float topMask = smoothstep(0.25, 0.05, uv.y);
  if(topMask < 0.01) {
    fragColor = vec4(uBgColor, 1.0);
    return;
  }

  // Parabolic base curve
  float arc = uv.x * uv.x * 0.4;

  // Domain warp x — medium speed sway for dancing folds
  float sway1 = fbm(vec2(uv.x * 0.4 + Tmed * 0.5, Tmed * 0.3)) * 0.35;
  float sway2 = fbm(vec2(uv.x * 0.8 + sway1 + Tmed * 0.4, Tmed * 0.2 + 3.0)) * 0.2;
  float wx = uv.x + sway1 + sway2;

  // Fast brightness ripple that travels along the ribbons
  float ripple1 = fbm(vec2(wx * 3.0 - Tfast, Tslow)) * 0.5 + 0.5;
  float ripple2 = fbm(vec2(wx * 2.5 + Tfast * 0.7 + 5.0, Tslow + 3.0)) * 0.5 + 0.5;

  vec3 col = vec3(0.0);

  // Vertical sway — each ribbon gets a different phase of medium-speed bobbing
  float vBob1 = fbm(vec2(Tmed * 0.6, wx * 0.5)) * 0.08;
  float vBob2 = fbm(vec2(Tmed * 0.5 + 3.0, wx * 0.4)) * 0.07;
  float vBob3 = fbm(vec2(Tmed * 0.7 + 7.0, wx * 0.6)) * 0.06;
  float vBob4 = fbm(vec2(Tmed * 0.4 + 11.0, wx * 0.3)) * 0.08;

  // --- Ribbon 1: main aurora curtain ---
  {
    float n = fbm(vec2(wx * 1.8 + Tslow * 0.3, Tmed * 0.3));
    float ribbonY = -0.02 + arc + vBob1 - n * 0.12;
    float brightness = ribbon(uv, ribbonY, 0.18, 20.0) * n * ripple1;
    col += vec3(0.23, 0.39, 0.92) * brightness * 1.4;
  }

  // --- Ribbon 2: offset, different speed ---
  {
    float n = fbm(vec2(wx * 1.4 - Tslow * 0.25 + 5.0, Tmed * 0.25 + 2.0));
    float ribbonY = -0.06 + arc + vBob2 - n * 0.10;
    float brightness = ribbon(uv, ribbonY, 0.15, 25.0) * n * ripple2;
    col += vec3(0.15, 0.51, 0.96) * brightness * 1.0;
  }

  // --- Ribbon 3: subtle background layer ---
  {
    float n = fbm(vec2(wx * 2.2 + Tslow * 0.15 + 10.0, Tmed * 0.2 + 5.0));
    float ribbonY = -0.10 + arc + vBob3 - n * 0.08;
    float brightness = ribbon(uv, ribbonY, 0.22, 15.0) * n * ripple1 * 0.8;
    col += vec3(0.11, 0.31, 0.83) * brightness * 0.7;
  }

  // --- Ribbon 4: violet accent ---
  {
    float n = fbm(vec2(wx * 1.0 - Tslow * 0.12 + 15.0, Tmed * 0.35 + 8.0));
    float ribbonY = 0.02 + arc + vBob4 - n * 0.10;
    float brightness = ribbon(uv, ribbonY, 0.12, 30.0) * n * ripple2 * 0.7;
    col += vec3(0.38, 0.65, 0.98) * brightness * 0.5;
  }

  col *= topMask;
  col = aces(col * 1.6);

  // Dithering
  col += (fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) - 0.5) / 255.0;

  // Blend onto background with amplitude reveal
  float reveal = min(uAmplitude / 0.32, 1.0);
  col = uBgColor + col * reveal;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
const RENDER_SCALE = 0.5;
const FPS_CAP = 30;
const FRAME_INTERVAL = 1000 / FPS_CAP;

const AMPLITUDE_TARGET = 0.64;
const AMPLITUDE_DURATION = 2000;
const AMPLITUDE_DELAY = 500;

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255]
    : [0, 0, 0];
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface UniformLocations {
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uAmplitude: WebGLUniformLocation | null;
  uBgColor: WebGLUniformLocation | null;
}

interface NebulaBackgroundProps {
  bgColor?: string;
  className?: string;
}

export function NebulaBackground({ bgColor = '#000000', className }: NebulaBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    uniforms: UniformLocations;
    buffer: WebGLBuffer;
    vs: WebGLShader;
    fs: WebGLShader;
    bg: [number, number, number];
    startTime: number;
    lastFrame: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertexSrc);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragmentSrc);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms: UniformLocations = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
      uBgColor: gl.getUniformLocation(program, 'uBgColor'),
    };

    stateRef.current = {
      gl,
      program,
      uniforms,
      buffer,
      vs,
      fs,
      bg: hexToRgb(bgColor),
      startTime: performance.now(),
      lastFrame: 0,
    };

    const updateScale = () => {
      const dpr = Math.max(1, window.devicePixelRatio * RENDER_SCALE);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    let rafId: number;
    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s) return;

      if (now - s.lastFrame < FRAME_INTERVAL) return;
      s.lastFrame = now;

      const elapsed = now - s.startTime;
      let amplitude = 0;
      if (elapsed > AMPLITUDE_DELAY) {
        const t = Math.min((elapsed - AMPLITUDE_DELAY) / AMPLITUDE_DURATION, 1);
        amplitude = AMPLITUDE_TARGET * easeOutCubic(t);
      }

      gl.clearColor(s.bg[0], s.bg[1], s.bg[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(s.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buffer);
      gl.uniform1f(s.uniforms.uTime, now * 1e-3);
      gl.uniform2f(s.uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(s.uniforms.uAmplitude, amplitude);
      gl.uniform3fv(s.uniforms.uBgColor, s.bg);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', updateScale);
      cancelAnimationFrame(rafId);
      gl.detachShader(program, vs);
      gl.deleteShader(vs);
      gl.detachShader(program, fs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.bg = hexToRgb(bgColor);
    }
  }, [bgColor]);

  return <canvas ref={canvasRef} className={className} />;
}

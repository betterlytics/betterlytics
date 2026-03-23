'use client';

import { useEffect, useRef } from 'react';

const vertexSrc = '#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}';

const fragmentSrc = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform float uAmplitude;
uniform float uBrightness;
uniform float uOpacity;
uniform vec3 uBgColor;

const int ITERATIONS = 40;
const float TAU = 6.28318530718;

// Actual Stitch rotation matrices
const mat3 GOLD = mat3(
  -0.571464913, +0.814921382, +0.096597072,
  -0.278044873, -0.303026659, +0.911518454,
  +0.772087367, +0.494042493, +0.399753815
);
const mat3 GOLD_PHI = mat3(
  -0.924648, -0.449886, 1.249265,
   1.318571, -0.490308, 0.800377,
   0.156297,  1.474868, 0.646816
);
const mat3 ROT1 = mat3(0.80,0.36,-0.48, -0.60,0.48,-0.64, 0.00,0.80,0.60);
const mat3 ROT2 = mat3(0.60,0.48,0.64, -0.80,0.36,0.48, 0.00,-0.80,0.60);

// Actual Stitch noise — dual golden matrix transform
float dot_noise(vec3 p) {
  return dot(cos(GOLD * p), sin(GOLD_PHI * p));
}

// Actual Stitch density — anisotropic scaling, per-octave rotation
float density(vec3 q, float amplitude, float depth, vec2 skew) {
  float d = 0.0;
  q.xy = (q.xy - 0.5) * skew + 0.5;
  q.z = q.z * depth;
  float n = dot_noise(q * vec3(1.6, 0.8, 1.1)) - 0.2;
  d += amplitude * n;
  float val = d * 0.5 + 0.5;
  float fd = max(0.0, val) * amplitude;
  q = (ROT1 * (q * vec3(0.8, 1.6, 0.9))) * 2.2 + vec3(1.025, 0.575, 0.425);
  amplitude *= 0.5 + 0.5 * (n * 0.5);
  n = dot_noise(q) - 0.2;
  d += amplitude * n;
  val = d * 0.5 + 0.5;
  fd += (val * val) * amplitude;
  q = (ROT2 * (q * vec3(1.6, 0.8, 1.1))) * 2.6 + vec3(2.05, 1.15, 0.85);
  amplitude *= 0.5 + 0.5 * abs(n);
  n = dot_noise(q) + 0.2;
  d += amplitude * n;
  val = d * 0.5 + 0.5;
  fd += (val * val) * amplitude;
  return fd;
}

// OKLab
vec3 safeCbrt(vec3 v) {
  return sign(v) * pow(abs(v), vec3(1.0/3.0));
}
vec3 oklab_mix(vec3 lin1, vec3 lin2, float a) {
  const mat3 kCONEtoLMS = mat3(
    0.4121656120, 0.2118591070, 0.0883097947,
    0.5362752080, 0.6807189584, 0.2818474174,
    0.0514575653, 0.1074065790, 0.6302613616);
  const mat3 kLMStoCONE = mat3(
    4.0767245293,-1.2681437731,-0.0041119885,
   -3.3072168827, 2.6093323231,-0.7034763098,
    0.2307590544,-0.3411344290, 1.7068625689);
  vec3 lms1 = safeCbrt(kCONEtoLMS * lin1);
  vec3 lms2 = safeCbrt(kCONEtoLMS * lin2);
  vec3 lms = mix(lms1, lms2, a);
  lms *= 1.0 + 0.025 * a * (1.0 - a);
  return kLMStoCONE * (lms * lms * lms);
}

// ACES
vec3 Tonemap_ACES(vec3 x) {
  return (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
}

// Cosine palette
vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

// Interleaved gradient noise for dithering
float interleavedGradientNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uv = gl_FragCoord.xy / uResolution;

  vec2 center = vec2(0.5, 0.3);

  // SDF elliptical mask — fixed position, contained to lower hero
  // Arc-shaped mask — curves higher at edges, lower in center
  float arc = (uv.x - 0.5) * (uv.x - 0.5) * 0.4;
  float cutoff = 0.25 + arc;
  float ampSdf = smoothstep(cutoff + 0.15, cutoff, uv.y);

  vec3 col = vec3(0.0);
  float transmittance = 1.0;

  if(ampSdf > 0.0) {
    vec2 uvCentered = (uv - center) * aspect;
    vec3 ro = vec3(center.x, center.y, -3.0);
    vec3 rd = normalize(vec3(uvCentered, 1.0));

    float MAX_DIST = 1.0 + 1.32;
    float baseStep = MAX_DIST / float(ITERATIONS);
    float ign = interleavedGradientNoise(uResolution * uv);
    float t = baseStep * ign * 0.999;
    float wrappedTime = uTime * 0.15;

    // Color params from Stitch source
    vec3 colorCenter = oklab_mix(vec3(0.333, 0.976, 1.0), vec3(0.267, 0.314, 0.518), 0.5);
    vec3 colorDelta = oklab_mix(vec3(0.267, 0.314, 0.518), vec3(0.333, 0.976, 1.0), 0.5);
    float absorptionFactor = baseStep * mix(-2.0, -6.0, uBrightness);
    float scale = mix(2.0, 8.0, 1.22);
    float ampBase = mix(0.2, 1.2, uAmplitude) * 2.0;
    float amplitude = ampBase * ampSdf;
    float depth = mix(1.0, 0.001, 0.66);
    vec2 skew = vec2(0.5, 1.5);

    vec3 q_ro = ro * scale + vec3(0.0, 0.42, 0.5 + 1.32) * wrappedTime;
    vec3 q_rd = rd * scale;

    float maxDepth = MAX_DIST * (0.2 + 0.8 * ampSdf * ampSdf);
    int emptySteps = 0;
    float accLight = 0.0;
    float lastDensity = 0.0;
    bool hit = false;

    for(int i = 0; i < ITERATIONS; i++) {
      if(transmittance < 0.01 || t > maxDepth) break;
      if(!hit && emptySteps > 20) break;
      if(accLight > 0.33) break;

      float pz = ro.z + rd.z * t;
      if(lastDensity > 2.0 && pz < -2.0) break;

      vec3 q = q_ro + q_rd * t;
      float d = density(q, amplitude, depth, skew);

      float dr = t / maxDepth;
      float pzSS = smoothstep(-3.0, -2.0, pz);
      float zFade = pzSS * (1.0 - dr * dr * (1.0 - ampSdf));
      d *= zFade;
      lastDensity = d;

      if(d > 0.0001) {
        float d_val = 0.25 / max(d, 0.0001);
        float atten = smoothstep(0.0, 1.0, d_val);
        float chroma = 0.5;
        vec3 mixed = pal(atten,
          colorCenter,
          colorDelta,
          vec3(1.0 - chroma, 1.0, 1.0 + chroma),
          vec3(chroma, 0.0, -chroma)
        );
        vec3 light = mixed * atten;
        float absorption = exp(-d * baseStep * 20.0);
        vec3 contribution = light * d * transmittance * absorptionFactor;
        col += contribution;
        accLight += abs(dot(contribution, vec3(0.299, 0.587, 0.114)));
        transmittance *= absorption;
        emptySteps = 0;
        hit = true;
      } else {
        emptySteps++;
      }
      t += baseStep;
    }
  }

  float maskStrength = ampSdf;
  col = Tonemap_ACES(col * maskStrength);
  transmittance = mix(1.0, transmittance, maskStrength);
  transmittance = smoothstep(0.0, 1.0, transmittance);

  vec3 blended = mix(uBgColor, col + uBgColor * transmittance, uOpacity);

  // Dithering
  blended += (interleavedGradientNoise(gl_FragCoord.xy) - 0.5) / 255.0;

  fragColor = vec4(clamp(blended, 0.0, 1.0), 1.0);
}`;

const vertices = [-1, 1, -1, -1, 1, 1, 1, -1];
const RENDER_SCALE = 0.5;
const FPS_CAP = 30;
const FRAME_INTERVAL = 1000 / FPS_CAP;

// Delay before shader starts rendering (lets page load finish)
const STARTUP_DELAY = 5000;

// Entry animation spec
const ANIM = {
  amplitude: { from: 0, to: 0.64, duration: 2000, delay: 0 },
  brightness: { from: 0, to: 0.4, duration: 2000, delay: 0 },
} as const;

// Opacity loop: fade in → hold → fade out → hold → repeat
const LOOP = {
  fadeIn: 3000,
  hold: 20000,
  fadeOut: 3000,
  pause: 5000,
} as const;
const LOOP_TOTAL = LOOP.fadeIn + LOOP.hold + LOOP.fadeOut + LOOP.pause;

function loopOpacity(elapsed: number): number {
  const t = elapsed % LOOP_TOTAL;
  if (t < LOOP.fadeIn) return easeOutCubic(t / LOOP.fadeIn);
  if (t < LOOP.fadeIn + LOOP.hold) return 1.0;
  if (t < LOOP.fadeIn + LOOP.hold + LOOP.fadeOut) {
    return 1.0 - easeOutCubic((t - LOOP.fadeIn - LOOP.hold) / LOOP.fadeOut);
  }
  return 0.0;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255] : [0, 0, 0];
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animateValue(elapsed: number, delay: number, duration: number, from: number, to: number): number {
  if (elapsed < delay) return from;
  const t = Math.min((elapsed - delay) / duration, 1);
  return from + (to - from) * easeOutCubic(t);
}

interface UniformLocations {
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uAmplitude: WebGLUniformLocation | null;
  uBrightness: WebGLUniformLocation | null;
  uOpacity: WebGLUniformLocation | null;
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
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
      uOpacity: gl.getUniformLocation(program, 'uOpacity'),
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

    // Clear to bg color immediately so canvas isn't black during delay
    gl.clearColor(stateRef.current.bg[0], stateRef.current.bg[1], stateRef.current.bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let rafId: number;
    let renderStartTime = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const s = stateRef.current;
      if (!s) return;

      // Wait for page to finish loading before starting the shader
      if (!renderStartTime) {
        if (now - s.startTime < STARTUP_DELAY) return;
        renderStartTime = now;
      }

      if (now - s.lastFrame < FRAME_INTERVAL) return;
      s.lastFrame = now;

      const elapsed = now - renderStartTime;
      const amplitude = animateValue(
        elapsed,
        ANIM.amplitude.delay,
        ANIM.amplitude.duration,
        ANIM.amplitude.from,
        ANIM.amplitude.to,
      );
      const brightness = animateValue(
        elapsed,
        ANIM.brightness.delay,
        ANIM.brightness.duration,
        ANIM.brightness.from,
        ANIM.brightness.to,
      );
      const opacity = loopOpacity(elapsed);

      gl.clearColor(s.bg[0], s.bg[1], s.bg[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(s.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, s.buffer);
      gl.uniform1f(s.uniforms.uTime, now * 1e-3);
      gl.uniform2f(s.uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform1f(s.uniforms.uAmplitude, amplitude);
      gl.uniform1f(s.uniforms.uBrightness, brightness);
      gl.uniform1f(s.uniforms.uOpacity, opacity);
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

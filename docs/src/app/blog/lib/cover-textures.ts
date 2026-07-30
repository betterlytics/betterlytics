// =============================================================================
// Procedural blog-cover textures — pure math, no Node/DOM dependencies.
//
// Everything here is deterministic given (seed, params): same inputs → same
// pixels, forever. That is the whole point — a post pins its seed + params in
// frontmatter so its cover never silently changes.
// =============================================================================

// ---------- Deterministic PRNG (mulberry32) ----------
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) | 0) + s.charCodeAt(i);
  return h >>> 0;
}

// ---------- Palettes ----------
// Each ramp ends below text-contrast so the cover chrome stays readable on top.
export type Rgb = [number, number, number];
export type Stop = { at: number; rgb: Rgb };
export type Palette = Stop[];

export const LIGHT_BLUE: Palette = [
  { at: 0, rgb: [247, 247, 248] },
  { at: 0.45, rgb: [216, 222, 232] },
  { at: 0.85, rgb: [178, 192, 214] },
  { at: 1, rgb: [140, 160, 188] },
];

export const LIGHT_NEUTRAL: Palette = [
  { at: 0, rgb: [247, 247, 248] },
  { at: 0.5, rgb: [218, 220, 224] },
  { at: 1, rgb: [178, 182, 190] },
];

export const DARK_BLUE: Palette = [
  { at: 0, rgb: [16, 17, 19] },
  { at: 0.45, rgb: [24, 32, 52] },
  { at: 0.85, rgb: [50, 76, 130] },
  { at: 1, rgb: [110, 140, 200] },
];

export const PALETTES = {
  blue: LIGHT_BLUE,
  neutral: LIGHT_NEUTRAL,
  "dark-blue": DARK_BLUE,
} as const;
export type PaletteName = keyof typeof PALETTES;

function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function gradientMap(v: number, stops: Palette): Rgb {
  if (v <= stops[0].at) return stops[0].rgb;
  const last = stops[stops.length - 1];
  if (v >= last.at) return last.rgb;
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i].at) {
      const a = stops[i - 1];
      const b = stops[i];
      const t = (v - a.at) / (b.at - a.at);
      return lerpRgb(a.rgb, b.rgb, t);
    }
  }
  return last.rgb;
}

// ---------- Field → RGBA (small buffer, before upscale) ----------
export function fieldToRgba(
  field: Float32Array,
  stops: Palette,
  contrast = 1,
): Uint8ClampedArray {
  // Normalize to [0,1].
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < field.length; i++) {
    if (field[i] < min) min = field[i];
    if (field[i] > max) max = field[i];
  }
  const range = max - min || 1;
  const out = new Uint8ClampedArray(field.length * 4);
  for (let i = 0; i < field.length; i++) {
    let v = (field[i] - min) / range;
    // Contrast: gain around the 0.5 midpoint (>1 widens dark↔bright spread).
    if (contrast !== 1) {
      v = 0.5 + (v - 0.5) * contrast;
      v = v < 0 ? 0 : v > 1 ? 1 : v;
    }
    const [r, g, b] = gradientMap(v, stops);
    out[i * 4 + 0] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  return out;
}

// =============================================================================
// Smoothed cave-generation CA
// Random binary fill → majority-rule iterations → 5×5 averaging to a continuous
// field. Reads as soft amorphous shapes — inkblot-like, with strong large form.
// =============================================================================
export type SmoothedCAParams = {
  /** Initial alive-cell probability. */
  fill: number;
  /** Cave-gen majority-rule iterations. */
  iters: number;
  /** Smoothing radius (5×5 average → 2). */
  smoothRadius: number;
  /** Weight of a finer second octave mixed in for small "drops" (0 = off). */
  detail: number;
  /** Cave-gen iterations for the fine octave (fewer → smaller features). */
  detailIters: number;
  /** Smoothing radius for the fine octave. */
  detailRadius: number;
};
export const SMOOTHED_CA_DEFAULTS: SmoothedCAParams = {
  fill: 0.47,
  iters: 6,
  smoothRadius: 2,
  detail: 4,
  detailIters: 1,
  detailRadius: 1,
};

// One cave-gen octave: random binary fill → majority-rule iterations → box
// average to a continuous [0,1] field.
function caOctave(
  w: number,
  h: number,
  rng: () => number,
  fill: number,
  iters: number,
  smoothRadius: number,
): Float32Array {
  const N = w * h;
  let g = new Uint8Array(N);
  for (let i = 0; i < N; i++) g[i] = rng() < fill ? 1 : 0;
  let next = new Uint8Array(N);
  // Cave-gen rule: cell alive if >= 5 of 9 neighbors alive (edges count alive).
  for (let iter = 0; iter < iters; iter++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
              count++; // treat edges as alive (closed walls)
            } else {
              count += g[ny * w + nx];
            }
          }
        }
        next[y * w + x] = count >= 5 ? 1 : 0;
      }
    }
    [g, next] = [next, g];
  }
  // Smooth: (2r+1)² average → continuous field.
  const out = new Float32Array(N);
  const r = smoothRadius;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let count = 0;
      let total = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            count += g[ny * w + nx];
            total++;
          }
        }
      }
      out[y * w + x] = count / total;
    }
  }
  return out;
}

export function makeSmoothedCA(
  w: number,
  h: number,
  seed: number,
  params: Partial<SmoothedCAParams> = {},
): Float32Array {
  const { fill, iters, smoothRadius, detail, detailIters, detailRadius } = {
    ...SMOOTHED_CA_DEFAULTS,
    ...params,
  };
  const N = w * h;
  // Main octave — large islands. (detail = 0 reproduces the original exactly.)
  const main = caOctave(w, h, mulberry32(seed), fill, iters, smoothRadius);
  if (detail <= 0) return main;

  // Fine octave — small drops — from an independent seed so it doesn't echo the
  // main structure. Added as zero-mean detail so islands keep their large form.
  const fine = caOctave(
    w,
    h,
    mulberry32((seed ^ 0x85ebca6b) >>> 0),
    fill,
    detailIters,
    detailRadius,
  );
  let fineMean = 0;
  for (let i = 0; i < N; i++) fineMean += fine[i];
  fineMean /= N;

  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = main[i] + detail * (fine[i] - fineMean);
  return out;
}

// =============================================================================
// Flow field
// Multi-octave sine sum → angle field → particles trace it, depositing density
// → 3×3 box blur. Reads as long flowing contour-like streamlines.
// =============================================================================
export type FlowFieldParams = {
  /** Number of sine harmonics summed into the angle field. */
  harmonics: number;
  /** Minimum spatial frequency for a harmonic. */
  freqMin: number;
  /** Frequency range added on top of freqMin (so max = freqMin + freqRange). */
  freqRange: number;
  /** Base amplitude of the first harmonic (each later one falls off). */
  ampBase: number;
  /** Amplitude falloff per harmonic index. */
  ampFalloff: number;
  /** Angle multiplier (× π) — higher wraps the field more often. */
  angleMul: number;
  /** Base particle count. */
  particlesBase: number;
  /** Random extra particles on top of the base. */
  particlesJitter: number;
  /** Steps each particle walks. */
  steps: number;
  /** Step length per move. */
  stepLen: number;
  /** Density deposited per step. */
  deposit: number;
  /** Final box-blur radius (3×3 → 1). */
  blurRadius: number;
  /**
   * Max trail brush radius (grid cells). 0 = single-pixel trails (uniform thin
   * veins). Higher widens veins independent of grid resolution; the per-particle
   * radius is cubic-biased toward 0, so most veins stay thin and a few run wide.
   */
  trailRadius: number;
};
export const FLOW_FIELD_DEFAULTS: FlowFieldParams = {
  harmonics: 10,
  freqMin: 0.15,
  freqRange: 0.3,
  ampBase: 0.5,
  ampFalloff: 0.55,
  angleMul: 1.6,
  particlesBase: 3000,
  particlesJitter: 200,
  steps: 100,
  stepLen: 0.8,
  deposit: 0.5,
  blurRadius: 1,
  trailRadius: 2,
};

export function makeFlowField(
  w: number,
  h: number,
  seed: number,
  params: Partial<FlowFieldParams> = {},
): Float32Array {
  const p = { ...FLOW_FIELD_DEFAULTS, ...params };
  const rng = mulberry32(seed);
  const N = w * h;

  // Build a smooth angle field from a sum of sines. A wider frequency range +
  // more harmonics give multiple local flow cells, so streamlines diverge into
  // several distinct contours instead of one global drift.
  const harm: {
    ax: number;
    ay: number;
    px: number;
    py: number;
    amp: number;
  }[] = [];
  for (let k = 0; k < p.harmonics; k++) {
    harm.push({
      ax: p.freqMin + rng() * p.freqRange,
      ay: p.freqMin + rng() * p.freqRange,
      px: rng() * Math.PI * 2,
      py: rng() * Math.PI * 2,
      amp: p.ampBase / (1 + k * p.ampFalloff),
    });
  }
  const angle = new Float32Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (const z of harm) {
        v += z.amp * Math.sin(z.ax * x + z.px) * Math.cos(z.ay * y + z.py);
      }
      angle[y * w + x] = v * Math.PI * p.angleMul;
    }
  }

  // Trace particles; accumulate density on a separate field. Each particle may
  // paint a wider trail (brush radius) so veins vary in width.
  const density = new Float32Array(N);
  const particles = p.particlesBase + Math.floor(rng() * p.particlesJitter);
  for (let i = 0; i < particles; i++) {
    let x = rng() * w;
    let y = rng() * h;
    // Cubic bias → most particles thin, a few wide. (No rng() call when the
    // brush is off, so trailRadius:0 reproduces the single-pixel trail exactly.)
    const pr = p.trailRadius > 0 ? Math.round(rng() ** 3 * p.trailRadius) : 0;
    const pr2 = pr * pr;
    for (let s = 0; s < p.steps; s++) {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      if (ix < 0 || ix >= w || iy < 0 || iy >= h) break;
      if (pr === 0) {
        density[iy * w + ix] += p.deposit;
      } else {
        for (let dy = -pr; dy <= pr; dy++) {
          const ny = iy + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -pr; dx <= pr; dx++) {
            const nx = ix + dx;
            if (nx < 0 || nx >= w) continue;
            const d2 = dx * dx + dy * dy;
            if (d2 > pr2) continue;
            const fall = 1 - Math.sqrt(d2) / (pr + 1);
            density[ny * w + nx] += p.deposit * fall;
          }
        }
      }
      const a = angle[iy * w + ix];
      x += Math.cos(a) * p.stepLen;
      y += Math.sin(a) * p.stepLen;
    }
  }

  // Box blur for smoothness.
  const r = p.blurRadius;
  const sm = new Float32Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let cnt = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            sum += density[ny * w + nx];
            cnt++;
          }
        }
      }
      sm[y * w + x] = sum / cnt;
    }
  }
  return sm;
}

// =============================================================================
// Voronoi soft cells
// Deterministic seed points; each pixel reports (d2 − d1), distance to the
// second-nearest minus the nearest seed. Small near borders, large in cell
// interiors → soft cellular structure.
// =============================================================================
export type VoronoiParams = {
  /** Base number of seed points. */
  seedsBase: number;
  /** Random extra seeds on top of the base. */
  seedsJitter: number;
  /** Divisor applied to (d2 − d1) before clamping to [0,1]. */
  scale: number;
};
export const VORONOI_DEFAULTS: VoronoiParams = {
  seedsBase: 16,
  seedsJitter: 4,
  scale: 3,
};

export function makeVoronoi(
  w: number,
  h: number,
  seed: number,
  params: Partial<VoronoiParams> = {},
): Float32Array {
  const { seedsBase, seedsJitter, scale } = { ...VORONOI_DEFAULTS, ...params };
  const rng = mulberry32(seed);
  const numSeeds = seedsBase + Math.floor(rng() * seedsJitter);
  const seeds: [number, number][] = [];
  for (let i = 0; i < numSeeds; i++) seeds.push([rng() * w, rng() * h]);
  const N = w * h;
  const out = new Float32Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let d1 = Infinity;
      let d2 = Infinity;
      for (const [sx, sy] of seeds) {
        const dx = x - sx;
        const dy = y - sy;
        const d = dx * dx + dy * dy;
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) {
          d2 = d;
        }
      }
      // Square-distance keeps the math cheap; sqrt-difference reads better.
      const e = Math.sqrt(d2) - Math.sqrt(d1);
      out[y * w + x] = Math.min(1, e / scale);
    }
  }
  return out;
}

// =============================================================================
// Texture registry — name → algorithm + default palette.
// =============================================================================
export type TextureName = "smoothed-ca" | "flow" | "voronoi";

export type TextureParams = {
  "smoothed-ca": SmoothedCAParams;
  flow: FlowFieldParams;
  voronoi: VoronoiParams;
};

// Post-processing defaults, per texture (applied by the route/raster pipeline).
// Tuned individually so each texture keeps its own look without a query param.
export type RenderDefaults = {
  /** Contrast gain around the 0.5 midpoint (see fieldToRgba). */
  contrast: number;
  /** Post-upscale gaussian blur sigma. */
  blur: number;
  /** Grain amount (0..1). */
  grain: number;
};

type TextureDef<K extends TextureName> = {
  fn: (
    w: number,
    h: number,
    seed: number,
    params?: Partial<TextureParams[K]>,
  ) => Float32Array;
  defaultPalette: PaletteName;
  defaults: TextureParams[K];
  render: RenderDefaults;
  /**
   * Compute-grid size (kept at the 1200/630 aspect ratio). Small on purpose —
   * bicubic upscale + blur do the rest. Flow needs a finer grid so streamlines
   * read as many fine flows rather than a few resolution-limited fat lines.
   */
  grid: { w: number; h: number };
};

const SMALL_GRID = { w: 80, h: 42 };

export const TEXTURES: { [K in TextureName]: TextureDef<K> } = {
  "smoothed-ca": {
    fn: makeSmoothedCA,
    defaultPalette: "neutral",
    defaults: SMOOTHED_CA_DEFAULTS,
    render: { contrast: 7, blur: 10, grain: 0.06 },
    grid: SMALL_GRID,
  },
  flow: {
    fn: makeFlowField,
    defaultPalette: "blue",
    defaults: FLOW_FIELD_DEFAULTS,
    render: { contrast: 1, blur: 2, grain: 0.06 },
    grid: { w: 200, h: 105 },
  },
  voronoi: {
    fn: makeVoronoi,
    defaultPalette: "blue",
    defaults: VORONOI_DEFAULTS,
    render: { contrast: 5, blur: 20, grain: 0.06 },
    grid: SMALL_GRID,
  },
};

export function renderDefaultsFor(name: TextureName): RenderDefaults {
  return TEXTURES[name].render;
}

export function gridFor(name: TextureName): { w: number; h: number } {
  return TEXTURES[name].grid;
}

export function isTextureName(v: unknown): v is TextureName {
  return v === "smoothed-ca" || v === "flow" || v === "voronoi";
}

/**
 * Compute a texture field and map it to a small RGBA buffer at the texture's
 * own grid size (see `gridFor`). The caller upscales + post-processes this.
 * Deterministic given (name, seed, params, palette, contrast).
 */
export function computeTextureRgba<K extends TextureName>(
  name: K,
  seed: number,
  opts: {
    params?: Partial<TextureParams[K]>;
    palette?: PaletteName;
    contrast?: number;
  } = {},
): Uint8ClampedArray {
  const def = TEXTURES[name];
  const field = def.fn(def.grid.w, def.grid.h, seed, opts.params);
  const palette = PALETTES[opts.palette ?? def.defaultPalette];
  return fieldToRgba(field, palette, opts.contrast ?? 1);
}

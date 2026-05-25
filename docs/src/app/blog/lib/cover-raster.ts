import "server-only";
import { deflateSync } from "node:zlib";
import { mulberry32, type Rgb } from "./cover-textures";

// =============================================================================
// Cover raster pipeline — turns a small RGBA field into the finished 1200×630
// texture PNG (background only; the route composites the chrome on top).
//
// Pipeline order mirrors the prototype's CSS stacking:
//   field RGBA → bilinear upscale → blur → left-fade → vignette → grain → PNG
// =============================================================================

const BG: Rgb = [247, 247, 248]; // #f7f7f8 — cover surface / fade target

// ---------- Bicubic upscale (Catmull-Rom) ----------
// Bilinear leaves visible faceted ramps at the 15× upscale we do here; a cubic
// kernel interpolates smoothly across a 4×4 neighborhood, so the upscaled field
// reads as continuous gradients instead of upscaling artifacts.
function cubicWeight(t: number): number {
  // Catmull-Rom (a = -0.5).
  const a = -0.5;
  const x = Math.abs(t);
  if (x <= 1) return (a + 2) * x * x * x - (a + 3) * x * x + 1;
  if (x < 2) return a * x * x * x - 5 * a * x * x + 8 * a * x - 4 * a;
  return 0;
}

function bicubicUpscale(
  src: Uint8ClampedArray,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Uint8ClampedArray {
  const dst = new Uint8ClampedArray(dw * dh * 4);
  const sx = sw / dw;
  const sy = sh / dh;
  const clamp = (v: number, max: number) => (v < 0 ? 0 : v > max ? max : v);
  for (let y = 0; y < dh; y++) {
    const fy = (y + 0.5) * sy - 0.5;
    const iy = Math.floor(fy);
    const ty = fy - iy;
    const wy = [
      cubicWeight(ty + 1),
      cubicWeight(ty),
      cubicWeight(ty - 1),
      cubicWeight(ty - 2),
    ];
    for (let x = 0; x < dw; x++) {
      const fx = (x + 0.5) * sx - 0.5;
      const ix = Math.floor(fx);
      const tx = fx - ix;
      const wx = [
        cubicWeight(tx + 1),
        cubicWeight(tx),
        cubicWeight(tx - 1),
        cubicWeight(tx - 2),
      ];
      const di = (y * dw + x) * 4;
      for (let c = 0; c < 4; c++) {
        let acc = 0;
        for (let m = -1; m <= 2; m++) {
          const syi = clamp(iy + m, sh - 1);
          let rowAcc = 0;
          for (let n = -1; n <= 2; n++) {
            const sxi = clamp(ix + n, sw - 1);
            rowAcc += src[(syi * sw + sxi) * 4 + c] * wx[n + 1];
          }
          acc += rowAcc * wy[m + 1];
        }
        dst[di + c] = acc;
      }
    }
  }
  return dst;
}

// ---------- Blur (3× box ≈ gaussian, the way CSS blur() is implemented) ----------
function boxBlurH(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
): void {
  const norm = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w * 4;
    for (let c = 0; c < 4; c++) {
      // Seed the running sum with the clamped left edge.
      let sum = src[row + c] * (r + 1);
      for (let x = 0; x < r; x++) sum += src[row + Math.min(x, w - 1) * 4 + c];
      for (let x = 0; x < w; x++) {
        const add = src[row + Math.min(x + r, w - 1) * 4 + c];
        const sub = src[row + Math.max(x - r - 1, 0) * 4 + c];
        sum += add - sub;
        dst[row + x * 4 + c] = sum * norm;
      }
    }
  }
}

function boxBlurV(
  src: Uint8ClampedArray,
  dst: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
): void {
  const norm = 1 / (2 * r + 1);
  for (let x = 0; x < w; x++) {
    const col = x * 4;
    for (let c = 0; c < 4; c++) {
      let sum = src[col + c] * (r + 1);
      for (let y = 0; y < r; y++)
        sum += src[Math.min(y, h - 1) * w * 4 + col + c];
      for (let y = 0; y < h; y++) {
        const add = src[Math.min(y + r, h - 1) * w * 4 + col + c];
        const sub = src[Math.max(y - r - 1, 0) * w * 4 + col + c];
        sum += add - sub;
        dst[y * w * 4 + col + c] = sum * norm;
      }
    }
  }
}

function blur(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  sigma: number,
): Uint8ClampedArray {
  if (sigma <= 0) return buf;
  // Box radius for a 3-pass approximation of a gaussian of the given sigma.
  const r = Math.max(1, Math.round((sigma * Math.sqrt(3)) / 2));
  let a = buf;
  let b = new Uint8ClampedArray(buf.length);
  for (let pass = 0; pass < 3; pass++) {
    boxBlurH(a, b, w, h, r);
    boxBlurV(b, a, w, h, r);
  }
  return a;
}

// ---------- Left-fade (keeps the text side readable) ----------
// A horizontal fade toward the surface color on the left, plus a soft radial lift in the bottom-right.
function piecewiseAlpha(t: number, stops: { at: number; a: number }[]): number {
  if (t <= stops[0].at) return stops[0].a;
  const last = stops[stops.length - 1];
  if (t >= last.at) return last.a;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].at) {
      const p = stops[i - 1];
      const q = stops[i];
      const k = (t - p.at) / (q.at - p.at);
      return p.a + (q.a - p.a) * k;
    }
  }
  return last.a;
}

const LEFT_FADE_STOPS = [
  { at: 0, a: 0.95 },
  { at: 0.18, a: 0.65 },
  { at: 0.45, a: 0.2 },
  { at: 0.65, a: 0 },
];

function applyFade(buf: Uint8ClampedArray, w: number, h: number): void {
  const [br, bg, bb] = BG;
  for (let y = 0; y < h; y++) {
    // Radial lift from the bottom-right corner.
    const ry = (h - y) / h;
    for (let x = 0; x < w; x++) {
      const aLin = piecewiseAlpha(x / w, LEFT_FADE_STOPS);
      const rx = (w - x) / w;
      const dr = Math.sqrt(rx * rx + ry * ry);
      const aRad = dr < 0.55 ? 0.45 * (1 - dr / 0.55) : 0;
      // Two source-over layers of the same color combine multiplicatively.
      const a = 1 - (1 - aLin) * (1 - aRad);
      if (a <= 0) continue;
      const i = (y * w + x) * 4;
      buf[i] = buf[i] * (1 - a) + br * a;
      buf[i + 1] = buf[i + 1] * (1 - a) + bg * a;
      buf[i + 2] = buf[i + 2] * (1 - a) + bb * a;
    }
  }
}

// ---------- Vignette (subtle corner darken) ----------
function applyVignette(buf: Uint8ClampedArray, w: number, h: number): void {
  const cx = w / 2;
  const cy = h / 2;
  const SQRT2 = Math.SQRT2;
  // rgba(40,50,65,0.04) at the corners, transparent inside 60% radius.
  for (let y = 0; y < h; y++) {
    const ny = (y - cy) / cy;
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / cx;
      const t = Math.sqrt(nx * nx + ny * ny) / SQRT2;
      if (t <= 0.6) continue;
      const a = 0.04 * Math.min(1, (t - 0.6) / 0.4);
      const i = (y * w + x) * 4;
      buf[i] = buf[i] * (1 - a) + 40 * a;
      buf[i + 1] = buf[i + 1] * (1 - a) + 50 * a;
      buf[i + 2] = buf[i + 2] * (1 - a) + 65 * a;
    }
  }
}

// ---------- Grain (fine seeded luminance noise) ----------
function applyGrain(
  buf: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number,
  seed: number,
): void {
  if (amount <= 0) return;
  const rng = mulberry32(seed >>> 0);
  const amp = amount * 80; // amount 0.06 → ±~4.8 levels — tactile, not visible
  for (let i = 0; i < w * h; i++) {
    const d = (rng() * 2 - 1) * amp;
    const j = i * 4;
    buf[j] += d;
    buf[j + 1] += d;
    buf[j + 2] += d;
  }
}

// ---------- Minimal PNG encoder (RGBA, no native deps) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(rgba: Uint8ClampedArray, w: number, h: number): Buffer {
  const stride = w * 4;
  const view = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  // Prefix each scanline with a 0 filter byte.
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    view.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------- Orchestration ----------
export type RasterOptions = {
  small: Uint8ClampedArray;
  smallW: number;
  smallH: number;
  width: number;
  height: number;
  blurSigma?: number;
  fade?: boolean;
  vignette?: boolean;
  grain?: number;
  grainSeed?: number;
};

export function renderTexturePng(opts: RasterOptions): Buffer {
  const {
    small,
    smallW,
    smallH,
    width,
    height,
    blurSigma = 3,
    fade = true,
    vignette = true,
    grain = 0.06,
    grainSeed = 0x9e3779b9,
  } = opts;

  let buf = bicubicUpscale(small, smallW, smallH, width, height);
  buf = blur(buf, width, height, blurSigma);
  if (fade) applyFade(buf, width, height);
  if (vignette) applyVignette(buf, width, height);
  applyGrain(buf, width, height, grain, grainSeed);
  return encodePng(buf, width, height);
}

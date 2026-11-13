export type Point = [number, number];

export function bezier(p: Point[], t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
    a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
  ];
}

/** A cubic sampled by arc length, so anything moving along it keeps a constant speed. */
export type Track = { points: Point[]; lengths: number[]; length: number };

export function track(p: Point[], steps = 48): Track {
  const points: Point[] = [p[0]];
  const lengths = [0];
  for (let i = 1; i <= steps; i++) {
    const next = bezier(p, i / steps);
    const prev = points[i - 1];
    points.push(next);
    lengths.push(lengths[i - 1] + Math.hypot(next[0] - prev[0], next[1] - prev[1]));
  }
  return { points, lengths, length: lengths[steps] };
}

export function along({ points, lengths }: Track, s: number): Point {
  let lo = 0;
  let hi = lengths.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (lengths[mid] < s) lo = mid;
    else hi = mid;
  }
  const f = Math.min(Math.max((s - lengths[lo]) / (lengths[hi] - lengths[lo] || 1), 0), 1);
  return [
    points[lo][0] + (points[hi][0] - points[lo][0]) * f,
    points[lo][1] + (points[hi][1] - points[lo][1]) * f,
  ];
}

export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

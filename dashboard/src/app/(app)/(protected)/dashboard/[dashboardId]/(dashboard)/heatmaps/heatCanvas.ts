import { HEATMAP_POINT_CELL_PX, type HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';

export const HEAT_RESOLUTION = 0.5;
const HEAT_RADIUS_PX = 18;
const MIN_ALPHA = 0.08;

const PALETTE_STOPS: ReadonlyArray<[number, string]> = [
  [0.25, 'rgb(0, 0, 255)'],
  [0.55, 'rgb(0, 255, 255)'],
  [0.7, 'rgb(0, 255, 0)'],
  [0.85, 'rgb(255, 255, 0)'],
  [1, 'rgb(255, 0, 0)'],
];

export function heatAlpha(count: number, maxCount: number): number {
  if (maxCount <= 0 || count <= 0) return 0;
  return Math.max(MIN_ALPHA, Math.min(1, Math.log1p(count) / Math.log1p(maxCount)));
}

export function colorizeAlpha(pixels: Uint8ClampedArray, palette: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha === 0) continue;
    const offset = alpha * 4;
    pixels[i] = palette[offset];
    pixels[i + 1] = palette[offset + 1];
    pixels[i + 2] = palette[offset + 2];
  }
}

function createPalette(): Uint8ClampedArray {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const [stop, color] of PALETTE_STOPS) gradient.addColorStop(stop, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}

function createStamp(radius: number): HTMLCanvasElement {
  const size = Math.ceil(radius * 2);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

// Points from the click query sit on the corner of their cell, so they are drawn at its
// center; points placed on an element are exact and pass 0
export function drawHeat(
  canvas: HTMLCanvasElement,
  points: HeatmapClickPoint[],
  width: number,
  height: number,
  pointOffset = HEATMAP_POINT_CELL_PX / 2,
) {
  const canvasWidth = Math.max(1, Math.round(width * HEAT_RESOLUTION));
  const canvasHeight = Math.max(1, Math.round(height * HEAT_RESOLUTION));
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (points.length === 0) return;

  const radius = HEAT_RADIUS_PX * HEAT_RESOLUTION;
  const stamp = createStamp(radius);
  const maxCount = points.reduce((max, point) => Math.max(max, point.count), 0);

  for (const point of points) {
    ctx.globalAlpha = heatAlpha(point.count, maxCount);
    ctx.drawImage(
      stamp,
      (point.x + pointOffset) * HEAT_RESOLUTION - radius,
      (point.y + pointOffset) * HEAT_RESOLUTION - radius,
    );
  }
  ctx.globalAlpha = 1;

  const image = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  colorizeAlpha(image.data, createPalette());
  ctx.putImageData(image, 0, 0);
}

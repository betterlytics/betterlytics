const FONT_CAP = 50;
const STRING_CAP = 500;

let ctx: CanvasRenderingContext2D | null = null;
let currentFont = '';
let listenersArmed = false;
let epoch = 0;
let measures = 0;
let cacheHits = 0;

const widthCache = new Map<string, Map<string, number>>();
let fontCache = new WeakMap<Element, string>();
const invalidationSubs = new Set<() => void>();

function bumpEpoch() {
  widthCache.clear();
  fontCache = new WeakMap();
  currentFont = '';
  epoch += 1;
  invalidationSubs.forEach((cb) => cb());
}

function armInvalidationListeners() {
  if (listenersArmed) return;
  listenersArmed = true;
  document.fonts?.ready?.then(bumpEpoch);
  document.fonts?.addEventListener?.('loadingdone', bumpEpoch);
  if (typeof window === 'undefined' || !window.matchMedia) return;
  const armDpr = () => {
    const media = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onChange = () => {
      media.removeEventListener('change', onChange);
      bumpEpoch();
      armDpr();
    };
    media.addEventListener('change', onChange);
  };
  armDpr();
}

function getContext(): CanvasRenderingContext2D {
  if (!ctx) {
    ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) throw new Error('text-fit: 2d canvas context unavailable');
    armInvalidationListeners();
  }
  return ctx;
}

export function measureText(text: string, font: string): number {
  let perFont = widthCache.get(font);
  const cached = perFont?.get(text);
  if (cached !== undefined) {
    cacheHits += 1;
    return cached;
  }
  const context = getContext();
  if (currentFont !== font) {
    context.font = font;
    currentFont = font;
  }
  measures += 1;
  const width = context.measureText(text).width;
  if (!perFont) {
    if (widthCache.size >= FONT_CAP) widthCache.clear();
    perFont = new Map();
    widthCache.set(font, perFont);
  }
  if (perFont.size >= STRING_CAP) perFont.clear();
  perFont.set(text, width);
  return width;
}

export function resolveFont(el: Element): string {
  const cached = fontCache.get(el);
  if (cached !== undefined) return cached;
  const style = getComputedStyle(el);
  const composed = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const context = getContext();
  context.font = composed;
  const validated = context.font || composed;
  currentFont = validated;
  fontCache.set(el, validated);
  return validated;
}

export function subscribeInvalidation(cb: () => void): () => void {
  invalidationSubs.add(cb);
  return () => invalidationSubs.delete(cb);
}

export function getEpoch(): number {
  return epoch;
}

export function getStats() {
  return { measures, cacheHits, epoch };
}

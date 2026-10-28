// The widest bar worth laying out for, and a floor on how narrow a glyph gets, so the estimate mounts too many rather than too few.
const WIDEST_BAR = 2560;
const MIN_GLYPH_WIDTH = 5;
const VALUE_CHROME = 6;
const MAX_MOUNTED_VALUES = 32;

// How many leading values the pill mounts: enough to fill the widest bar at the narrowest plausible glyphs, capped.
export function mountedPillValueCount(values: string[]): number {
  let width = 0;
  for (let index = 0; index < values.length; index++) {
    if (index >= MAX_MOUNTED_VALUES) return index;
    width += values[index].length * MIN_GLYPH_WIDTH + VALUE_CHROME;
    if (width > WIDEST_BAR) return index + 1;
  }
  return values.length;
}

// Read on hover only: whether the laid-out pill hides anything, so the tooltip has something to add.
export function pillHidesValues(pill: Element): boolean {
  if (pill.querySelector('[data-pill-rest]')) return true;
  return [...pill.querySelectorAll<HTMLElement>('[data-pill-value]')].some((value) => {
    const inner = value.firstElementChild;
    return inner instanceof HTMLElement && inner.scrollWidth > inner.clientWidth;
  });
}

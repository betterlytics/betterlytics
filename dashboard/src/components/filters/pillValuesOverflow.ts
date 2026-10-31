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

// The same signal as the CSS fade: the probe on the last value collapses only when the pill does not fit everything.
const pillOverflows = (element: Element) => {
  const probe = element.querySelector('[data-pill-probe]');
  return probe !== null && probe.getBoundingClientRect().width < 0.5;
};

// From the values' right edges, in order: every value from the first one that reaches past `clearUntil`.
export function obscuredValueCount(rights: number[], clearUntil: number, count: number): number {
  const first = rights.findIndex((right) => right > clearUntil);
  return first < 0 ? 0 : count - first;
}

// The count for the "+N more" label: every value whose end is more covered than visible, past the fade's midpoint.
export function hiddenPillValueCount(container: HTMLElement, label: HTMLElement, count: number): number {
  if (count < 2 || !pillOverflows(container)) return 0;
  const rights = [...container.querySelectorAll('[data-pill-value] > :first-child')].map(
    (value) => value.getBoundingClientRect().right,
  );
  const fade = parseFloat(getComputedStyle(label, '::before').width) || 0;
  return obscuredValueCount(rights, label.getBoundingClientRect().left - fade / 2, count);
}

// Read on hover only: whether the laid-out pill hides anything, so the tooltip has something to add.
export function pillHidesValues(pill: Element): boolean {
  return pill.querySelector('[data-pill-rest]') !== null || pillOverflows(pill);
}

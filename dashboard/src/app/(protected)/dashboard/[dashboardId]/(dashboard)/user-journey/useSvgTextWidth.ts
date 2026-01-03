import { useLayoutEffect, useState, RefObject } from 'react';

interface UseSvgTextWidthOptions {
  // Minimum width fallback
  min?: number;
  // Maximum width clamp
  max?: number;
  // Extra pixels to add (padding, gap, etc.)
  padding?: number;
}

export function useSvgTextWidth(
  ref: RefObject<SVGTextElement | null>,
  deps: unknown[] = [],
  options: UseSvgTextWidthOptions = {},
) {
  const { min = 0, max = Infinity, padding = 0 } = options;
  const [width, setWidth] = useState(min);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    try {
      const bbox = el.getBBox();
      const measured = bbox.width + padding;
      const clamped = Math.min(max, Math.max(min, measured));

      if (Number.isFinite(clamped)) {
        setWidth(clamped);
      }
    } catch {
      // getBBox can throw if element is not rendered yet
    }
  }, deps);

  return width;
}

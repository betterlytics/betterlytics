import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

const PEEK_MIN_WIDTH = 40;

type FilterBandOverflowOptions = {
  bandRef: RefObject<HTMLElement | null>;
  rowRef: RefObject<HTMLElement | null>;
  // Present only while the band shows its toggle
  toggleRef: RefObject<HTMLElement | null>;
  // Any value that changes exactly when the pills do
  pillsKey: unknown;
  count: number;
  open: boolean;
  onFits: () => void;
};

// Measures how many pills wrap past the band's first row and where a peek of the next one fits
export function useFilterBandOverflow({
  bandRef,
  rowRef,
  toggleRef,
  pillsKey,
  count,
  open,
  onFits,
}: FilterBandOverflowOptions) {
  const wrappedAtRef = useRef(-Infinity);
  const [hidden, setHidden] = useState(0);
  const [peekLeft, setPeekLeft] = useState<number | null>(null);

  const measure = useCallback(() => {
    const band = bandRef.current;
    const row = rowRef.current;
    const items = row ? [...row.querySelectorAll<HTMLElement>(':scope > [data-filter-pill]')] : [];
    if (!band || !row || items.length === 0) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const top = items[0].offsetTop;
    let first = items.findIndex((item) => item.offsetTop > top);
    const toggle = toggleRef.current;
    if (!toggle) {
      if (first >= 0) wrappedAtRef.current = band.clientWidth;
    } else if (first >= 0) {
      /*
       * The toggle narrows the row, so only the pill widths can say whether it is still needed. Squeezed pills
       * and a band width that already wrapped are ruled out, or the two layouts flip forever.
       */
      const content = row.getBoundingClientRect().width;
      const widths = items.map((item) => item.getBoundingClientRect().width);
      const spare =
        toggle.getBoundingClientRect().width - (toggle.lastElementChild?.getBoundingClientRect().width ?? 0);
      const needed = widths.reduce((sum, width) => sum + width, 0) + gap * (items.length - 1);
      const squeezed = widths.some((width) => width >= content - 0.5);
      if (!squeezed && needed <= content + spare - 0.5 && band.clientWidth > wrappedAtRef.current) first = -1;
    }
    items.forEach((item, index) => {
      item.toggleAttribute('inert', !open && first >= 0 && index >= first);
      // Keeps the band's title off live controls
      item
        .querySelectorAll('[data-pill-part]:not([title]), [data-pill-remove]:not([title])')
        .forEach((section) => section.setAttribute('title', ''));
    });
    setHidden(first < 0 ? 0 : count - first);
    if (first < 0) {
      setPeekLeft(null);
      onFits();
      return;
    }
    const last = items[first - 1];
    const left = last.offsetLeft + last.offsetWidth + gap;
    setPeekLeft(row.clientWidth - left >= PEEK_MIN_WIDTH ? left : null);
  }, [bandRef, rowRef, toggleRef, count, open, onFits]);

  // Changed pills void the wrap history
  useLayoutEffect(() => {
    wrappedAtRef.current = -Infinity;
  }, [pillsKey]);

  useLayoutEffect(measure);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(row);
    row.querySelectorAll(':scope > [data-filter-pill]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [rowRef, measure, pillsKey]);

  return { hidden, peekLeft };
}

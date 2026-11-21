import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

const PEEK_MIN_WIDTH = 32;

type FilterBandOverflowOptions = {
  rowRef: RefObject<HTMLElement | null>;
  // The fade and "+N more" label over the end of row one, present only while pills overflow
  coverRef: RefObject<HTMLElement | null>;
  // Any value that changes exactly when the pills do
  pillsKey: unknown;
  count: number;
  open: boolean;
  onFits: () => void;
};

/*
 * Measures how many pills row one hides and where a peek of the next one fits.
 * Where the label has no room after the last pill, that pill is covered and counted as hidden instead.
 */
export function useFilterBandOverflow({
  rowRef,
  coverRef,
  pillsKey,
  count,
  open,
  onFits,
}: FilterBandOverflowOptions) {
  const [hidden, setHidden] = useState(0);
  const [peekLeft, setPeekLeft] = useState<number | null>(null);

  const measure = useCallback(() => {
    const row = rowRef.current;
    const items = row ? [...row.querySelectorAll<HTMLElement>(':scope > [data-filter-pill]')] : [];
    if (!row || items.length === 0) return;
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const top = items[0].offsetTop;
    const wrapped = items.findIndex((item) => item.offsetTop > top);
    const cover = coverRef.current;
    const labelled = (cover?.lastElementChild?.getBoundingClientRect().width ?? 0) > 0;
    const last = items[wrapped - 1];
    const left = last ? last.offsetLeft + last.offsetWidth + gap : 0;
    const peeks = wrapped > 0 && row.clientWidth - left >= Math.max(PEEK_MIN_WIDTH, cover?.offsetWidth ?? 0);
    const first = wrapped > 1 && labelled && !peeks ? wrapped - 1 : wrapped;
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
    setPeekLeft(peeks ? left : null);
  }, [rowRef, coverRef, count, open, onFits]);

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

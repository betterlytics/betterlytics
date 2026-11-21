import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

type BandState = 'collapsed' | 'expanded' | 'collapsing';

// Whether the filter band shows all its rows, with the height slide between and what dismisses it
export function useFilterBandDisclosure(bandRef: RefObject<HTMLElement | null>) {
  const heightRef = useRef<number | null>(null);
  const [state, setState] = useState<BandState>('collapsed');
  const expanded = state === 'expanded';

  const toggle = useCallback(
    () => setState((current) => (current === 'expanded' ? 'collapsing' : 'expanded')),
    [],
  );
  const reset = useCallback(() => setState('collapsed'), []);

  // Height slide with the accordion's timing
  useLayoutEffect(() => {
    const band = bandRef.current;
    const pill = band?.querySelector<HTMLElement>('[data-filter-pill]');
    if (state === 'collapsed' || !band || !pill) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (state === 'collapsing') setState('collapsed');
      return;
    }
    const { paddingTop, paddingBottom } = getComputedStyle(band);
    const single = pill.offsetHeight + parseFloat(paddingTop) + parseFloat(paddingBottom);
    const full = band.offsetHeight;
    const to = state === 'expanded' ? full : single;
    const from = heightRef.current ?? (state === 'expanded' ? single : full);
    band.style.overflow = 'clip';
    const animation = band.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: 200,
      easing: 'ease-out',
      fill: state === 'collapsing' ? 'forwards' : 'none',
    });
    animation.onfinish = () => {
      if (state === 'collapsing') setState('collapsed');
      else band.style.overflow = '';
    };
    return () => {
      heightRef.current = band.getBoundingClientRect().height;
      animation.cancel();
      band.style.overflow = '';
    };
  }, [bandRef, state]);

  // Outside click or Escape collapses, except from the filter editor
  useEffect(() => {
    if (!expanded) return;
    const band = bandRef.current;
    const inEditor = (target: EventTarget | null) =>
      target instanceof Element && target.closest('[data-radix-popper-content-wrapper], [role=dialog]') !== null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !band?.contains(event.target) && !inEditor(event.target))
        setState('collapsing');
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || inEditor(event.target)) return;
      const focused = document.activeElement;
      const top = band?.querySelector<HTMLElement>('[data-filter-pill]')?.offsetTop;
      const staysInView = focused?.closest<HTMLElement>('[data-filter-pill]')?.offsetTop === top;
      // Focus on a control that is about to leave moves to the chevron
      if (band?.contains(focused) && !staysInView)
        band.querySelector<HTMLElement>('[data-band-toggle]')?.focus({ preventScroll: true });
      setState('collapsing');
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [bandRef, expanded]);

  // Open lasts until the collapse slide has finished
  return { expanded, open: state !== 'collapsed', toggle, reset };
}

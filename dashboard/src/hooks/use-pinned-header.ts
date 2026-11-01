import { useEffect, type RefObject } from 'react';

export function usePinnedHeader(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const header = ref.current;
    if (!enabled || !header) return;

    let frame = 0;

    const updateStuck = () => {
      frame = 0;
      const { position, top } = getComputedStyle(header);
      const stuck = position === 'sticky' && header.getBoundingClientRect().top <= parseFloat(top) + 1;
      header.toggleAttribute('data-stuck', stuck);
    };

    const scheduleStuckUpdate = () => {
      frame ||= requestAnimationFrame(updateStuck);
    };

    // Below xl only the filter band stays in view: the header pins this far above the topbar's edge.
    // offsetTop rather than getBoundingClientRect, which would include the band's entrance translate.
    const measureBandOffset = () => {
      const band = header.querySelector<HTMLElement>('[data-slot=active-filters-band]');
      const rowGap = parseFloat(getComputedStyle(header).rowGap) || 0;
      const offset = band ? band.offsetTop - rowGap : 0;
      header.style.setProperty('--pinned-header-band-offset', `${Math.max(0, offset)}px`);
      scheduleStuckUpdate();
    };

    const resizeObserver = new ResizeObserver(measureBandOffset);
    resizeObserver.observe(header);
    window.addEventListener('scroll', scheduleStuckUpdate, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleStuckUpdate);
      cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);
}

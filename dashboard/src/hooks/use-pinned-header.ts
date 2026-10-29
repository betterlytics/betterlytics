import { useEffect, type RefObject } from 'react';

export function usePinnedHeader(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    const root = document.documentElement;
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

    const measure = () => {
      // Below xl only the filter band stays in view: the header pins this far above the topbar's edge.
      const band = header.querySelector('[data-slot=active-filters-band]');
      const rowGap = parseFloat(getComputedStyle(header).rowGap) || 0;
      const offset = band ? band.getBoundingClientRect().top - header.getBoundingClientRect().top - rowGap : 0;
      header.style.setProperty('--pinned-header-band-offset', `${Math.max(0, offset)}px`);

      // Keeps focused and scrolled-to elements from landing underneath the pinned area.
      const { position, top } = getComputedStyle(header);
      if (position === 'sticky') root.style.scrollPaddingTop = `${parseFloat(top) + header.offsetHeight}px`;
      else root.style.removeProperty('scroll-padding-top');

      scheduleStuckUpdate();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(header);
    window.addEventListener('scroll', scheduleStuckUpdate, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleStuckUpdate);
      cancelAnimationFrame(frame);
      root.style.removeProperty('scroll-padding-top');
    };
  }, [ref]);
}

import { useEffect, useState, type RefObject } from 'react';

// Whether the element has scrolled up behind the sticky topbar, so none of it is in view any more.
export function useScrolledBehindTopbar(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [behind, setBehind] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) {
      setBehind(false);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const edge = document.querySelector('[data-slot=topbar]')?.getBoundingClientRect().bottom ?? 0;
      const { height, bottom } = element.getBoundingClientRect();
      setBehind(height > 0 && bottom <= edge);
    };
    const schedule = () => {
      frame ||= requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [ref, enabled]);

  return behind;
}

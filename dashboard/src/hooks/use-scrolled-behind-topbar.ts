import { useEffect, useState, type RefObject } from 'react';

// True once the element has scrolled fully behind the sticky topbar
export function useScrolledBehindTopbar(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  const [behind, setBehind] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) {
      setBehind(false);
      return;
    }

    const edge = document.querySelector('[data-slot=topbar]')?.getBoundingClientRect().bottom ?? 0;
    // The viewport below the topbar, so leaving it upwards means the element is behind the topbar
    const observer = new IntersectionObserver(
      ([entry]) => {
        const { height, bottom } = entry.boundingClientRect;
        setBehind(!entry.isIntersecting && height > 0 && bottom <= (entry.rootBounds?.top ?? edge));
      },
      { rootMargin: `-${edge}px 0px 0px 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, enabled]);

  return behind;
}

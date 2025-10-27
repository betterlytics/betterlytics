import { useEffect, useState } from 'react';

/**
 * Tracks whether the pointer is “over the map” for autoHighlight purposes.
 * Its set to true onHover by the DeckGL instance
 */
export function useIsMapHovered(overlaySelectors: string | string[]) {
  const [isMapHovered, setIsMapHovered] = useState(true);

  useEffect(() => {
    const selectors = Array.isArray(overlaySelectors) ? overlaySelectors : [overlaySelectors];
    let rafId: number;

    rafId = requestAnimationFrame(() => {
      const overlayElements: HTMLElement[] = [];
      selectors.forEach((sel) => {
        overlayElements.push(...Array.from(document.querySelectorAll<HTMLElement>(sel)));
      });
      if (!overlayElements.length) return;

      const handleEnter = () => setIsMapHovered(false);
      const handleBlur = () => setIsMapHovered(false);
      const handleMouseLeaveDocument = () => setIsMapHovered(false);

      overlayElements.forEach((el) => el.addEventListener('mouseover', handleEnter));
      window.addEventListener('blur', handleBlur);
      document.addEventListener('mouseleave', handleMouseLeaveDocument);

      return () => {
        overlayElements.forEach((el) => el.removeEventListener('mouseover', handleEnter));
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('mouseleave', handleMouseLeaveDocument);
      };
    });

    return () => cancelAnimationFrame(rafId);
  }, [overlaySelectors]);

  return { isMapHovered, setIsMapHovered };
}

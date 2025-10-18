// src/hooks/use-mobile.tsx
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize synchronously when running in the browser
  const getInitial = () => (typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);

  const [isMobile, setIsMobile] = React.useState<boolean>(getInitial);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    // initialize from mql (safer if CSS or zoom affects matchMedia)
    setIsMobile(mql.matches);

    let timeout: number | undefined;

    const onChange = (e: MediaQueryListEvent) => {
      // debounce to avoid multiple rapid state updates when resizing
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        setIsMobile(!!e.matches);
      }, 100);
    };

    // addEventListener on modern browsers; fallback to addListener for older ones
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange as EventListener);
    } else {
      // legacy Safari / older browsers
      // @ts-ignore
      mql.addListener(onChange);
    }

    return () => {
      if (timeout) window.clearTimeout(timeout);
      if (typeof mql.removeEventListener === 'function') {
        mql.removeEventListener('change', onChange as EventListener);
      } else {
        // @ts-ignore
        mql.removeListener(onChange);
      }
    };
  }, []);

  return isMobile;
}

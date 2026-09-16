import * as React from 'react';

const LG_BREAKPOINT = 1024;

export function useLgViewport() {
  const [isLgViewport, setIsLgViewport] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsLgViewport(e.matches);
    mql.addEventListener('change', onChange);
    setIsLgViewport(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isLgViewport;
}

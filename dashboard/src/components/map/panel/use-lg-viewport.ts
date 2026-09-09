import * as React from 'react';

const LG_BREAKPOINT = 1024;

export function useLgViewport() {
  const [isLgViewport, setIsLgViewport] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    const onChange = () => {
      setIsLgViewport(window.innerWidth >= LG_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsLgViewport(window.innerWidth >= LG_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isLgViewport;
}

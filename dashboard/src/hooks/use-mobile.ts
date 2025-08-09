import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false); // Start with false so we don't trigger the initial render based on unknown screen size

  React.useEffect(() => {
    const onResize = () => {
      const mobileStatus = window.innerWidth < MOBILE_BREAKPOINT;
      console.log('Window resized: isMobile', mobileStatus); // Check if resizing is properly tracked
      setIsMobile(mobileStatus);
    };

    // Check initial size immediately
    onResize();

    // Add the resize event listener
    window.addEventListener('resize', onResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []); // Empty dependency array, so the effect runs once when the component is mounted

  return isMobile;
}

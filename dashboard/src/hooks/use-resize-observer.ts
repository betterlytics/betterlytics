import { useState, useEffect, type RefObject } from 'react';

type ResizeObservedRef = RefObject<Element | null>;

export function useResizeObserver(ref: ResizeObservedRef) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}

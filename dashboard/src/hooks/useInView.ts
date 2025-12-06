import { useEffect, useState } from 'react';

type UseInViewOptions = {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
};

export function useInView<T extends HTMLElement>({
  root = null,
  rootMargin = '0px',
  threshold = 0,
}: UseInViewOptions = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        root,
        rootMargin,
        threshold,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, root, rootMargin, threshold]);

  return { ref: setNode, inView };
}

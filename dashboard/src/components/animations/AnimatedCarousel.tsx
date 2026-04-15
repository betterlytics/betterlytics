'use client';

import { type ReactNode, useEffect, useRef, useState, useCallback } from 'react';
import { useAnimate, useReducedMotion } from 'motion/react';

type AnimatedCarouselProps = {
  children: ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
};

export function AnimatedCarousel({
  children,
  speed = 50,
  pauseOnHover = true,
  className,
}: AnimatedCarouselProps) {
  const [scope, animate] = useAnimate();
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  const measureWidth = useCallback(() => {
    if (scope.current) {
      setContentWidth(scope.current.scrollWidth / 2);
    }
  }, [scope]);

  useEffect(() => {
    measureWidth();
    const observer = new ResizeObserver(measureWidth);
    if (scope.current) {
      observer.observe(scope.current);
    }
    return () => observer.disconnect();
  }, [measureWidth, scope]);

  useEffect(() => {
    if (contentWidth <= 0 || prefersReducedMotion) return;

    const animation = animate(
      scope.current,
      { x: [0, -contentWidth] },
      {
        duration: contentWidth / speed,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
      }
    );

    animationRef.current = animation;

    return () => animation.stop();
  }, [contentWidth, speed, prefersReducedMotion, animate, scope]);

  const handleMouseEnter = useCallback(() => {
    animationRef.current?.pause();
  }, []);

  const handleMouseLeave = useCallback(() => {
    animationRef.current?.play();
  }, []);

  if (prefersReducedMotion) {
    return (
      <div style={{ overflow: 'hidden' }}>
        <div className={className} style={{ display: 'flex', width: 'max-content' }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ overflow: 'hidden' }}
      onMouseEnter={pauseOnHover ? handleMouseEnter : undefined}
      onMouseLeave={pauseOnHover ? handleMouseLeave : undefined}
    >
      <div
        ref={scope}
        className={className}
        style={{ display: 'flex', width: 'max-content' }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

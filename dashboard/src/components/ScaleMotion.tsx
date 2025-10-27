'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import type { AnimationPlaybackControls, MotionValue, Transition } from 'framer-motion';
import * as React from 'react';

export type ScaleMotionProps = {
  children: React.ReactNode;
  initialScale?: number;
  hoverScale?: number;
  opacityRange?: [number, number];
  opacityValues?: [number, number];
  startTransition?: Transition;
  endTransition?: Transition;
  onHoverStartComplete?: () => void;
  onHoverEndComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;

  /** externally control hover state */
  isHovered?: boolean;
  /** when true, ignore internal hover/touch handlers */
  disableEventHover?: boolean;
};

export const ScaleMotion = React.forwardRef<HTMLDivElement, ScaleMotionProps>(function ScaleMotion(
  {
    children,
    initialScale = 0.9,
    hoverScale = 1,
    opacityRange,
    opacityValues,
    startTransition,
    endTransition,
    onHoverStartComplete,
    onHoverEndComplete,
    className,
    style,
    isHovered,
    disableEventHover,
  },
  ref,
) {
  const scale = useMotionValue(initialScale);
  const opacity = opacityRange && opacityValues ? useTransform(scale, opacityRange, opacityValues) : undefined;

  const controlsRef = React.useRef<AnimationPlaybackControls | null>(null);
  const defaultSpring: Transition = { type: 'spring', stiffness: 200, damping: 20 };

  const animateTo = (target: number, transitionOverride?: Transition, onComplete?: () => void) => {
    controlsRef.current?.stop();
    controlsRef.current = animate(scale as MotionValue<number>, target, {
      ...defaultSpring,
      ...(transitionOverride ?? {}),
      onComplete,
    });
  };

  const handleStart = () => animateTo(hoverScale, startTransition, onHoverStartComplete);
  const handleEnd = () => animateTo(initialScale, endTransition, onHoverEndComplete);

  React.useEffect(() => {
    if (typeof isHovered === 'boolean') {
      isHovered ? handleStart() : handleEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  const eventHandlers = disableEventHover
    ? {}
    : {
        onHoverStart: handleStart,
        onHoverEnd: handleEnd,
        onTouchStart: handleStart,
        onTouchEnd: handleEnd,
      };

  return (
    <motion.div
      ref={ref}
      className={className}
      {...eventHandlers}
      style={{ scale, ...(opacity ? { opacity } : {}), ...style }}
    >
      {children}
    </motion.div>
  );
});

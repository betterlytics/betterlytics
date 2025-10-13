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
  startTransition?: Transition; // optional transition for hover start
  endTransition?: Transition; // optional transition for hover end
  onHoverStartComplete?: () => void; // fires when the "scale up" finishes
  onHoverEndComplete?: () => void; // fires when the "scale down" finishes
  className?: string;
  style?: React.CSSProperties;
};

export function ScaleMotion({
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
}: ScaleMotionProps) {
  const scale = useMotionValue(initialScale);
  const opacity = opacityRange && opacityValues ? useTransform(scale, opacityRange, opacityValues) : undefined;

  const controlsRef = React.useRef<AnimationPlaybackControls | null>(null);

  const defaultSpring: Transition = { type: 'spring', stiffness: 200, damping: 20 };

  const animateTo = (target: number, transitionOverride?: Transition, onComplete?: () => void) => {
    controlsRef.current?.stop();

    controlsRef.current = animate(scale as MotionValue<number>, target, {
      ...defaultSpring,
      ...(transitionOverride ?? {}),
      onComplete: onComplete,
    });
  };

  const handleStart = () => animateTo(hoverScale, startTransition, onHoverStartComplete);
  const handleEnd = () => animateTo(initialScale, endTransition, onHoverEndComplete);

  return (
    <motion.div
      className={className}
      onHoverStart={handleStart}
      onHoverEnd={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      style={{
        scale,
        ...(opacity ? { opacity } : {}),
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

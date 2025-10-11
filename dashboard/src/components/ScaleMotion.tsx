'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import type { MotionValue, Transition } from 'framer-motion';
import * as React from 'react';

export type ScaleMotionProps = {
  children: React.ReactNode;
  initialScale?: number;
  hoverScale?: number;
  opacityRange?: [number, number];
  opacityValues?: [number, number];
  startTransition?: Transition; // optional transition for hover start
  endTransition?: Transition; // optional transition for hover end
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
  className,
  style,
}: ScaleMotionProps) {
  const scale = useMotionValue(initialScale);

  const opacity = opacityRange && opacityValues ? useTransform(scale, opacityRange, opacityValues) : undefined;

  const animateTo = (target: number, transitionOverride?: Transition) => {
    animate(
      scale as MotionValue<number>,
      target,
      transitionOverride ?? { type: 'spring', stiffness: 200, damping: 20 },
    );
  };

  return (
    <motion.div
      className={className}
      onHoverStart={() => animateTo(hoverScale, startTransition)}
      onHoverEnd={() => animateTo(initialScale, endTransition)}
      onTouchStart={() => animateTo(hoverScale, startTransition)}
      onTouchEnd={() => animateTo(initialScale, endTransition)}
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

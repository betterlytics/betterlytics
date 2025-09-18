import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import type { MotionValue, Transition } from 'framer-motion';
import * as React from 'react';

export type ScaleMotionProps = {
  children: React.ReactNode;
  initialScale?: number;
  hoverScale?: number;
  opacityRange?: [number, number];
  opacityValues?: [number, number];
  transition?: Transition;
  className?: string;
  style?: React.CSSProperties;
};

export function ScaleMotion({
  children,
  initialScale = 0.9,
  hoverScale = 1,
  opacityRange,
  opacityValues,
  transition,
  className,
  style,
}: ScaleMotionProps) {
  const scale = useMotionValue(initialScale);

  // useTransform directly (don't wrap in useMemo)
  const opacity = opacityRange && opacityValues ? useTransform(scale, opacityRange, opacityValues) : undefined;

  const animateTo = (target: number) =>
    animate(scale as MotionValue<number>, target, transition ?? { type: 'spring', stiffness: 200, damping: 20 });

  return (
    <motion.div
      className={className}
      onHoverStart={() => animateTo(hoverScale)}
      onHoverEnd={() => animateTo(initialScale)}
      onTouchStart={() => animateTo(hoverScale)}
      onTouchEnd={() => animateTo(initialScale)}
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

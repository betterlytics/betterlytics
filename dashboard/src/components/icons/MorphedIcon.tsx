'use client';
import { interpolate } from 'flubber';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

export type MorphedIconProps = {
  paths: string[];
  active: boolean; // Pass true to trigger morph
  duration?: number;
  color?: string;
};

/**
 * Interpolates smoothly between paths on active
 */
export default function MorphedIcon({ paths, active, duration = 0.5, color = 'currentColor' }: MorphedIconProps) {
  const progress = useMotionValue(active ? 1 : 0);
  const path = useTransform(progress, [0, 1, 2], paths, {
    mixer: (a, b) => interpolate(a, b, { maxSegmentLength: 1 }),
  });

  useEffect(() => {
    const animation = animate(progress, active ? 1 : 0, {
      duration,
      type: 'spring',
    });
    return () => animation.stop();
  }, [active]);

  return <motion.path fill={color} d={path} />;
}

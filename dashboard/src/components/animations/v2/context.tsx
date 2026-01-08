'use client';

import { createContext, useContext } from 'react';
import type { AnimatedNumberContextValue } from './types';

export const AnimatedNumberContext = createContext<AnimatedNumberContextValue | null>(null);

export function useAnimatedNumber(): AnimatedNumberContextValue {
  const ctx = useContext(AnimatedNumberContext);
  if (!ctx) {
    throw new Error('useAnimatedNumber must be used within AnimatedNumberV2');
  }
  return ctx;
}

'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export type HeroBackground = 'retro-grid' | 'grid' | 'dots' | 'diagonal-stripes';
export type HeroGradient =
  | 'bottom-fade'
  | 'text-spotlight'
  | 'radial-center'
  | 'top-vignette'
  | 'blue-wash';
export type HeroMode = 'nodes' | 'event-rays';

interface BackgroundContextValue {
  background: HeroBackground;
  setBackground: (bg: HeroBackground) => void;
  gradients: Set<HeroGradient>;
  toggleGradient: (g: HeroGradient) => void;
  heroMode: HeroMode;
  setHeroMode: (m: HeroMode) => void;
}

const BackgroundContext = createContext<BackgroundContextValue>({
  background: 'retro-grid',
  setBackground: () => {},
  gradients: new Set(),
  toggleGradient: () => {},
  heroMode: 'nodes',
  setHeroMode: () => {},
});

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBackground] = useState<HeroBackground>('retro-grid');
  const [gradients, setGradients] = useState<Set<HeroGradient>>(
    new Set(['bottom-fade', 'text-spotlight', 'radial-center', 'top-vignette', 'blue-wash']),
  );
  const [heroMode, setHeroMode] = useState<HeroMode>('nodes');

  const toggleGradient = useCallback((g: HeroGradient) => {
    setGradients((prev) => {
      const next = new Set(prev);
      if (next.has(g)) {
        next.delete(g);
      } else {
        next.add(g);
      }
      return next;
    });
  }, []);

  return (
    <BackgroundContext.Provider
      value={{ background, setBackground, gradients, toggleGradient, heroMode, setHeroMode }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export function useHeroBackground() {
  return useContext(BackgroundContext);
}

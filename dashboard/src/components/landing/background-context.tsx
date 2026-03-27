'use client';

import { createContext, useContext, useState, useCallback } from 'react';

export type HeroBackground = 'retro-grid' | 'grid' | 'dots' | 'diagonal-stripes';
export type HeroGradient =
  | 'bottom-fade'
  | 'text-spotlight'
  | 'radial-center'
  | 'top-vignette'
  | 'blue-wash';

interface BackgroundContextValue {
  background: HeroBackground;
  setBackground: (bg: HeroBackground) => void;
  gradients: Set<HeroGradient>;
  toggleGradient: (g: HeroGradient) => void;
}

const BackgroundContext = createContext<BackgroundContextValue>({
  background: 'retro-grid',
  setBackground: () => {},
  gradients: new Set(),
  toggleGradient: () => {},
});

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [background, setBackground] = useState<HeroBackground>('retro-grid');
  const [gradients, setGradients] = useState<Set<HeroGradient>>(
    new Set(['bottom-fade', 'text-spotlight', 'radial-center', 'top-vignette', 'blue-wash']),
  );

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
    <BackgroundContext.Provider value={{ background, setBackground, gradients, toggleGradient }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useHeroBackground() {
  return useContext(BackgroundContext);
}

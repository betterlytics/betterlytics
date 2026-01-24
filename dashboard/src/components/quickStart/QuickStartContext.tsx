'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { QuickStartProgress } from '@/entities/dashboard/quickStart.entities';

type QuickStartContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  progress: QuickStartProgress | null;
  setProgress: (progress: QuickStartProgress) => void;
};

const QuickStartContext = createContext<QuickStartContextType | null>(null);

export function useQuickStart() {
  const context = useContext(QuickStartContext);
  if (!context) {
    throw new Error('useQuickStart must be used within QuickStartProvider');
  }
  return context;
}

export function useQuickStartOptional() {
  return useContext(QuickStartContext);
}

type QuickStartProviderProps = {
  children: ReactNode;
  initialProgress?: QuickStartProgress | null;
};

export function QuickStartProvider({ children, initialProgress = null }: QuickStartProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<QuickStartProgress | null>(initialProgress);

  return (
    <QuickStartContext.Provider value={{ isOpen, setIsOpen, progress, setProgress }}>
      {children}
    </QuickStartContext.Provider>
  );
}

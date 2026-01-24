'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { QuickStartProgress } from '@/entities/dashboard/quickStart.entities';
import { getQuickStartProgressAction } from '@/app/actions/dashboard/quickStart.action';

type QuickStartContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  progress: QuickStartProgress | null;
  setProgress: (progress: QuickStartProgress) => void;
  refreshProgress: () => Promise<void>;
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
  dashboardId: string;
  initialProgress?: QuickStartProgress | null;
};

export function QuickStartProvider({ children, dashboardId, initialProgress = null }: QuickStartProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<QuickStartProgress | null>(initialProgress);

  const refreshProgress = useCallback(async () => {
    try {
      const newProgress = await getQuickStartProgressAction(dashboardId);
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to refresh quick start progress:', error);
    }
  }, [dashboardId]);

  return (
    <QuickStartContext.Provider value={{ isOpen, setIsOpen, progress, setProgress, refreshProgress }}>
      {children}
    </QuickStartContext.Provider>
  );
}

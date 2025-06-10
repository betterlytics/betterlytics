'use client';

import React, { createContext, useContext } from 'react';
import { useOpen } from '@/hooks/use-open';

type OpenContextProps = ReturnType<typeof useOpen>;

const OpenContext = createContext<OpenContextProps | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export function OpenProvider({ children }: Props) {
  const openHandler = useOpen();
  return <OpenContext.Provider value={openHandler}>{children}</OpenContext.Provider>;
}

export function useOpenContext() {
  const context = useContext(OpenContext);
  if (!context) throw new Error('useOpenContext must be used within OpenProvider');
  return context;
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type FlowOverlayProps = {
  children: ReactNode;
};

export function FlowOverlay({ children }: FlowOverlayProps) {
  // Render immediately on the client so the shell never blanks for a frame; the portal
  // target only exists in the browser, so stay null during SSR.
  const [mounted, setMounted] = useState(() => typeof document !== 'undefined');

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className='bg-background animate-in fade-in-0 fixed inset-0 z-50 flex flex-col duration-150'>
      {children}
    </div>,
    document.body,
  );
}

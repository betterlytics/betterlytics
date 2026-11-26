'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type FlowOverlayProps = {
  children: ReactNode;
};

const noopSubscribe = () => () => {};

export function FlowOverlay({ children }: FlowOverlayProps) {
  // The portal target only exists in the browser. Hydration uses the server snapshot (false) to
  // match the server HTML and re-renders right after; a client-side mount (opening by click) uses
  // the client snapshot, so the overlay shows on the first frame.
  const canPortal = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!canPortal) return null;

  return createPortal(
    <div className='bg-background animate-in fade-in-0 fixed inset-0 z-50 flex flex-col duration-150'>
      {children}
    </div>,
    document.body,
  );
}

'use client';

import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { SessionProvider } from 'next-auth/react';

/** Use `m.*`, not `motion.*`: only domAnimation is loaded, and `strict` enforces it. */
export function LandingProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion='user'>{children}</MotionConfig>
      </LazyMotion>
    </SessionProvider>
  );
}

'use client';

import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { SessionProvider } from 'next-auth/react';

/**
 * The landing's client context: the session, which the nav reads to offer the
 * dashboard, and motion. Motion loads only the DOM animation features (use `m.*`,
 * not `motion.*`; `strict` enforces it) and stills transform animations for
 * readers who ask for reduced motion.
 */
export function LandingProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion='user'>{children}</MotionConfig>
      </LazyMotion>
    </SessionProvider>
  );
}

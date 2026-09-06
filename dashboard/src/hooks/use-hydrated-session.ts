'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

/**
 * Hydration-safe wrapper around authClient.useSession().
 *
 * better-auth's session store is shared across all subscribers and can resolve
 * before a component hydrates, making its first client render differ from the
 * server HTML (which always renders with isPending=true). Keep isPending true
 * until after hydration so both renders match.
 */
export function useHydratedSession() {
  const session = authClient.useSession();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return { ...session, isPending: session.isPending || !isHydrated };
}

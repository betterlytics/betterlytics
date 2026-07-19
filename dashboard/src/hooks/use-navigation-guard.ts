'use client';

import { useEffect } from 'react';

/**
 * While `when` is true, intercepts same-origin link clicks (sidebar, breadcrumbs, back links)
 * and routes them through `onNavigate` instead of navigating, so the caller can confirm first.
 * Complements the `beforeunload` guard in useUnsavedChanges, which only covers full page loads.
 */
export function useNavigationGuard(when: boolean, onNavigate: (href: string) => void) {
  useEffect(() => {
    if (!when) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      event.stopPropagation();
      onNavigate(url.pathname + url.search + url.hash);
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [when, onNavigate]);
}

'use client';

import React, { useCallback } from 'react';
import { useTopLoader } from 'nextjs-toploader';

type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

function willUnloadPage(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return false;
  const target = e.currentTarget.getAttribute('target');
  if (target && target !== '_self') return false;
  return !/^(mailto:|tel:|otpauth:)/i.test(e.currentTarget.getAttribute('href') ?? '');
}

/**
 * Wrapper for the anchor HTML-element (<a>), that triggers the TopLoader's loading animation before navigating.
 * Skips the loader when the click won't unload the page (new tab, modifier keys, mailto/tel/otpauth).
 */
function ExternalLink({ children, onClick, ...props }: ExternalLinkProps) {
  const { start: startLoader } = useTopLoader();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      onClick?.(e);
      if (willUnloadPage(e)) startLoader();
    },
    [startLoader, onClick],
  );

  return (
    <a {...props} onClick={handleClick}>
      {children}
    </a>
  );
}

export default React.memo(ExternalLink);

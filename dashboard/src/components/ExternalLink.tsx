'use client';

import React, { useCallback } from 'react';
import { useTopLoader } from 'nextjs-toploader';

type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Wrapper for the anchor HTML-element (<a>), that triggers the TopLoader's loading animation before navigating
 */
const ExternalLink: React.FC<ExternalLinkProps> = ({ children, onClick, ...props }) => {
  const { start: startLoader } = useTopLoader();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      startLoader();
      onClick?.(e);
    },
    [startLoader, onClick],
  );

  return (
    <a {...props} onClick={handleClick}>
      {children}
    </a>
  );
};

export default ExternalLink;

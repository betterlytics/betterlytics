'use client';

import React from 'react';
import { useTopLoader } from 'nextjs-toploader';

type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

/** Wrapper for the anchor HTML-element (<a>), that triggers the TopLoader's loading animation before navigating */
const ExternalLink: React.FC<ExternalLinkProps> = ({ children, ...props }) => {
  const { start: startLoader } = useTopLoader();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    startLoader();
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <a onClick={handleClick} {...props}>
      {children}
    </a>
  );
};

export default ExternalLink;

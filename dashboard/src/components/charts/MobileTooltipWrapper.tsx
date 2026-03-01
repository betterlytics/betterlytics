'use client';

import React, { useState, useCallback, type CSSProperties } from 'react';

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

interface MobileTooltipWrapperProps {
  children: React.ReactNode;
  isMobile: boolean;
  onDismiss?: () => void;
}

export function MobileTooltipWrapper({ children, isMobile, onDismiss }: MobileTooltipWrapperProps) {
  if (!isMobile) return children;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.();
  };

  return (
    <div
      onTouchStart={stopPropagation}
      onTouchMove={stopPropagation}
      onTouchEnd={stopPropagation}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}

const MOBILE_WRAPPER_STYLE: CSSProperties = { pointerEvents: 'auto' };

export function useMobileTooltipDismiss(isMobile: boolean) {
  const [dismissed, setDismissed] = useState(false);

  const onDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const onChartEvent = useCallback(() => {
    if (dismissed) setDismissed(false);
  }, [dismissed]);

  const tooltipActive = isMobile && dismissed ? false : undefined;
  const wrapperStyle = isMobile ? MOBILE_WRAPPER_STYLE : undefined;

  return { tooltipActive, wrapperStyle, onDismiss, onChartEvent };
}

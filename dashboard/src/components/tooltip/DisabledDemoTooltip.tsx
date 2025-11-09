'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

import { DisabledTooltip } from './DisabledTooltip';
import { useDemoMode } from '@/contexts/DemoModeContextProvider';

type DisabledDemoTooltipProps = {
  disabled?: boolean;
  message?: React.ReactNode;
  children: (disabled: boolean) => React.ReactElement;
  wrapperClassName?: string;
};

export function DisabledDemoTooltip({
  disabled = true,
  message,
  children,
  wrapperClassName,
}: DisabledDemoTooltipProps) {
  const isDemo = useDemoMode();
  const t = useTranslations('components.demoMode');

  const shouldDisable = isDemo && disabled;
  const resolvedMessage = message ?? t('notAvailable');

  if (!shouldDisable) {
    return children(false);
  }

  return (
    <DisabledTooltip disabled={shouldDisable} message={resolvedMessage} wrapperClassName={wrapperClassName}>
      {children}
    </DisabledTooltip>
  );
}

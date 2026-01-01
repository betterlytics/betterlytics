'use client';

import { useTranslations } from 'next-intl';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';

type CapabilityGateProps = {
  allowed: boolean;
  children: (props: { locked: boolean }) => React.ReactElement;
  message?: string;
  showTooltip?: boolean;
};

/**
 * Gate component for capability-based feature locking
 *
 * @example
 * <CapabilityGate allowed={caps.monitoring.httpMethodConfigurable}>
 *   {({ locked }) => (
 *     <Tabs disabled={locked}>
 *       <TabsTrigger>GET {locked && <ProBadge />}</TabsTrigger>
 *     </Tabs>
 *   )}
 * </CapabilityGate>
 */
export function CapabilityGate({ allowed, children, message, showTooltip = false }: CapabilityGateProps) {
  const t = useTranslations('components.proFeature');

  if (allowed) {
    return children({ locked: false });
  }

  if (!showTooltip) {
    return children({ locked: true });
  }

  const tooltipMessage = message ?? t('upgradeRequired');

  return (
    <DisabledTooltip disabled message={tooltipMessage}>
      {() => children({ locked: true })}
    </DisabledTooltip>
  );
}

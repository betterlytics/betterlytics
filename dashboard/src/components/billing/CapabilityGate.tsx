'use client';

type CapabilityGateProps = {
  allowed: boolean;
  children: (props: { locked: boolean }) => React.ReactElement;
};

/**
 * Gate component for capability-based feature locking
 *
 * @example
 * <CapabilityGate allowed={caps.monitoring.httpMethodConfigurable}>
 *   {({ locked }) => (
 *     <Tabs disabled={locked}>
 *       <TabsTrigger>GET <PlanBadge plan={upgradeFor(caps, (c) => c.monitoring.httpMethodConfigurable)} /></TabsTrigger>
 *     </Tabs>
 *   )}
 * </CapabilityGate>
 */
export function CapabilityGate({ allowed, children }: CapabilityGateProps) {
  return children({ locked: !allowed });
}

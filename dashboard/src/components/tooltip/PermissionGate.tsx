'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DisabledTooltip } from './DisabledTooltip';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { Permission } from '@/lib/permissions';

type PermissionGateProps = {
  permission?: Permission;
  requireMutation?: boolean;
  when?: boolean;
  message?: React.ReactNode;
  children: (disabled: boolean) => React.ReactElement;
  wrapperClassName?: string;
};

/**
 * A generic permission gate component that disables UI elements based on
 * - Demo mode (public dashboard)
 * - Role-based permissions
 *
 * Usage:
 * ```tsx
 * // Check specific permission
 * <PermissionGate permission="canDeleteDashboard">
 *   {(disabled) => <Button disabled={disabled}>Manage Members</Button>}
 * </PermissionGate>
 *
 * // Check if user can mutate (not demo, not viewer)
 * <PermissionGate requireMutation>
 *   {(disabled) => <Button disabled={disabled}>Create Monitor</Button>}
 * </PermissionGate>
 *
 * // Demo-only check (default behavior)
 * <PermissionGate>
 *   {(disabled) => <Button disabled={disabled}>Action</Button>}
 * </PermissionGate>
 *
 * // Conditional gating - only gate if condition is true
 * <PermissionGate permission="canDeleteDashboard" when={member.role !== 'owner'}>
 *   {(disabled) => <Button disabled={disabled}>Edit Role</Button>}
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  requireMutation = false,
  when = true,
  message,
  children,
  wrapperClassName,
}: PermissionGateProps) {
  const { isDemo, canMutate, hasPermission } = useDashboardAuth();
  const t = useTranslations('components.permissions');

  const baseIsDisabled = permission ? !hasPermission(permission) : requireMutation ? !canMutate : isDemo;

  const isDisabled = when && baseIsDisabled;

  const resolvedMessage = message ?? (isDemo ? t('demoNotAvailable') : t('insufficientPermissions'));

  if (!isDisabled) {
    return children(false);
  }

  return (
    <DisabledTooltip disabled message={resolvedMessage} wrapperClassName={wrapperClassName}>
      {children}
    </DisabledTooltip>
  );
}

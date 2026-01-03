'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DisabledTooltip } from './DisabledTooltip';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { Permission } from '@/lib/permissions';

type PermissionGateProps = {
  permission?: Permission;
  allowViewer?: boolean;
  when?: boolean;
  hideWhenDisabled?: boolean;
  message?: React.ReactNode;
  children: (disabled: boolean) => React.ReactElement;
  wrapperClassName?: string;
};

/**
 * Permission gate component that disables UI elements based on
 * - Demo mode (public dashboard)
 * - Role-based permissions
 *
 * By default, blocks both demo users AND viewers
 *
 * Usage:
 * ```tsx
 * // Default: blocks demo + viewer
 * <PermissionGate>
 *   {(disabled) => <Button disabled={disabled}>Create Monitor</Button>}
 * </PermissionGate>
 *
 * // Check specific permission
 * <PermissionGate permission="canDeleteDashboard">
 *   {(disabled) => <Button disabled={disabled}>Manage Members</Button>}
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
  allowViewer = false,
  when = true,
  hideWhenDisabled = false,
  message,
  children,
  wrapperClassName,
}: PermissionGateProps) {
  const { isDemo, canMutate, hasPermission } = useDashboardAuth();
  const t = useTranslations('components.permissions');

  const baseIsDisabled = permission ? !hasPermission(permission) : allowViewer ? isDemo : !canMutate;

  const isDisabled = when && baseIsDisabled;

  const resolvedMessage = message ?? (isDemo ? t('demoNotAvailable') : t('insufficientPermissions'));

  if (!isDisabled) {
    return children(false);
  }

  if (hideWhenDisabled) {
    return null;
  }

  return (
    <DisabledTooltip disabled message={resolvedMessage} wrapperClassName={wrapperClassName}>
      {children}
    </DisabledTooltip>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import SettingsSection from '@/components/settings/SettingsSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  enableUserAction,
  revokeAllUserSessionsAction,
  revokeUserSessionAction,
} from '@/actions/admin/users.action';
import type { AdminEdition, AdminTargetAction } from '@/entities/admin/adminAccess.entities';
import type { AdminUserView } from '@/entities/admin/adminUser.entities';
import { RoleBadge } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(settings)/settings/members/member-utils';
import { AdminConfirmDialog } from '@/app/(app)/(protected)/admin/_components/AdminConfirmDialog';
import {
  describeUserAgent,
  formatDate,
  formatRelative,
  userDisplayName,
} from '@/app/(app)/(protected)/admin/_lib/format';
import { UserRoleBadge } from '@/app/(app)/(protected)/admin/users/_components/UserBadges';
import {
  UserActionDialogs,
  type AdminUserDialog,
} from '@/app/(app)/(protected)/admin/users/_components/UserActionDialogs';
import { useAdminMutation } from '@/app/(app)/(protected)/admin/users/_components/useAdminMutation';

const PROVIDER_LABELS: Record<string, string> = { google: 'Google', github: 'GitHub' };

type UserDetailViewProps = {
  user: AdminUserView;
  edition: AdminEdition;
  actorUserId: string;
  emailsEnabled: boolean;
};

export function UserDetailView({ user, edition, actorUserId, emailsEnabled }: UserDetailViewProps) {
  const [dialog, setDialog] = useState<AdminUserDialog | null>(null);
  const can = (action: AdminTargetAction) => user.actions[action] === null;
  const deleted = user.status === 'deleted';

  return (
    <div className='space-y-12'>
      <ProfileSection user={user} edition={edition} canChangeRole={!deleted && can('change_role')} onDialog={setDialog} />

      {!deleted && (
        <>
          <DashboardsSection user={user} />
          <SessionsSection user={user} canRevoke={can('revoke_sessions')} />
          {user.status === 'active' && (can('reset_password') || can('reset_two_factor')) && (
            <SecuritySection user={user} can={can} onDialog={setDialog} />
          )}
          <DangerZoneSection user={user} can={can} onDialog={setDialog} />
        </>
      )}

      <UserActionDialogs
        user={user}
        dialog={dialog}
        onClose={() => setDialog(null)}
        actorUserId={actorUserId}
        emailsEnabled={emailsEnabled}
        redirectAfterDelete='/admin/users'
      />
    </div>
  );
}

function DetailRow({ label, description, children }: { label: string; description?: string; children: ReactNode }) {
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
      <div className='min-w-0'>
        <span className='text-sm font-medium'>{label}</span>
        {description && <p className='text-muted-foreground text-xs'>{description}</p>}
      </div>
      <div className='text-muted-foreground flex shrink-0 items-center gap-2 text-sm'>{children}</div>
    </div>
  );
}

type SectionProps = { user: AdminUserView };
type DialogSectionProps = SectionProps & { onDialog: (dialog: AdminUserDialog) => void };
type ActionSectionProps = DialogSectionProps & { can: (action: AdminTargetAction) => boolean };

function ProfileSection({
  user,
  edition,
  canChangeRole,
  onDialog,
}: DialogSectionProps & { edition: AdminEdition; canChangeRole: boolean }) {
  const signInMethods = [
    ...(user.hasPassword ? ['Password'] : []),
    ...user.oauthProviders.map((provider) => PROVIDER_LABELS[provider] ?? provider),
  ];
  const isAdmin = edition === 'cloud' ? user.isSuperAdmin : user.role === 'admin';

  return (
    <SettingsSection title='Profile'>
      {user.status !== 'deleted' && (
        <>
          <DetailRow label='Email'>
            <span className='text-foreground break-all'>{user.email}</span>
          </DetailRow>
          <DetailRow label='Name'>{user.name || 'Not set'}</DetailRow>
        </>
      )}
      <DetailRow
        label='Role'
        description={edition === 'selfhost' ? 'Admins can open this panel and manage every user.' : undefined}
      >
        <UserRoleBadge
          label={edition === 'cloud' ? (isAdmin ? 'Super admin' : 'User') : isAdmin ? 'Admin' : 'User'}
          highlighted={isAdmin}
        />
        {canChangeRole && (
          <Button
            variant='outline'
            size='sm'
            className='cursor-pointer'
            onClick={() => onDialog(isAdmin ? 'demote' : 'promote')}
          >
            {isAdmin ? 'Remove admin' : 'Make admin'}
          </Button>
        )}
      </DetailRow>
      {user.status !== 'deleted' && (
        <>
          <DetailRow label='Sign-in methods'>{signInMethods.join(', ') || 'None'}</DetailRow>
          <DetailRow label='Two-factor authentication'>{user.twoFactorEnabled ? 'On' : 'Off'}</DetailRow>
        </>
      )}
      <DetailRow label='Joined'>{formatDate(user.createdAt)}</DetailRow>
      <DetailRow label='Last active'>
        <span title={user.lastActiveAt ? formatDate(user.lastActiveAt, true) : undefined}>
          {formatRelative(user.lastActiveAt)}
        </span>
      </DetailRow>
      {user.disabledAt && <DetailRow label='Disabled'>{formatDate(user.disabledAt, true)}</DetailRow>}
    </SettingsSection>
  );
}

function DashboardsSection({ user }: SectionProps) {
  const owned = user.dashboards.filter((dashboard) => dashboard.role === 'owner').length;

  return (
    <SettingsSection
      title='Dashboards'
      description={
        user.dashboards.length === 0
          ? undefined
          : `Member of ${user.dashboards.length} dashboard${user.dashboards.length === 1 ? '' : 's'}, owner of ${owned}.`
      }
    >
      {user.dashboards.length === 0 ? (
        <p className='text-muted-foreground py-2 text-center text-sm'>Not a member of any dashboard.</p>
      ) : (
        <ul className='divide-y'>
          {user.dashboards.map((dashboard) => (
            <li key={dashboard.dashboardId} className='flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0'>
              <span className='truncate text-sm font-medium'>{dashboard.domain}</span>
              <RoleBadge role={dashboard.role} />
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
}

function SessionsSection({ user, canRevoke }: SectionProps & { canRevoke: boolean }) {
  const { run, isPending } = useAdminMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const label = userDisplayName(user);
  const revocable = user.sessions.filter((session) => !session.isCurrent);

  return (
    <SettingsSection
      title='Sessions'
      description='Devices that are signed in to this account.'
      headerExtra={
        canRevoke && revocable.length > 0 ? (
          <Button
            variant='outline'
            size='sm'
            className='shrink-0 cursor-pointer'
            disabled={isPending}
            onClick={() => setConfirmOpen(true)}
          >
            <LogOut className='h-4 w-4' />
            {user.isSelf ? 'Sign out other devices' : 'Sign out everywhere'}
          </Button>
        ) : undefined
      }
    >
      {user.sessions.length === 0 ? (
        <p className='text-muted-foreground py-2 text-center text-sm'>No active sessions.</p>
      ) : (
        <ul className='divide-y'>
          {user.sessions.map((session) => (
            <li key={session.id} className='flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0'>
              <div className='min-w-0'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  {describeUserAgent(session.userAgent)}
                  {session.isCurrent && (
                    <Badge variant='outline' className='text-xs font-normal'>
                      This device
                    </Badge>
                  )}
                </div>
                <p className='text-muted-foreground truncate text-xs'>
                  {[session.ipAddress, `Signed in ${formatDate(session.createdAt, true)}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              {canRevoke && !session.isCurrent && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-destructive hover:text-destructive/80 shrink-0 cursor-pointer'
                  disabled={isPending}
                  onClick={() =>
                    run(() => revokeUserSessionAction(user.id, session.id), { success: 'Session signed out' })
                  }
                >
                  Sign out
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AdminConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={user.isSelf ? 'Sign out your other devices?' : `Sign ${label} out everywhere?`}
        description={
          user.isSelf
            ? 'Every other device is signed out. This one stays signed in.'
            : 'Every device is signed out. They can sign in again unless you also disable the account.'
        }
        confirmLabel='Sign out'
        destructive
        isPending={isPending}
        onConfirm={() =>
          run(() => revokeAllUserSessionsAction(user.id), {
            success: 'Sessions signed out',
            onSuccess: () => setConfirmOpen(false),
          })
        }
      />
    </SettingsSection>
  );
}

function SecuritySection({ user, can, onDialog }: ActionSectionProps) {
  const passwordDescription = user.hasPassword
    ? 'Create a one-time link that lets them choose a new password.'
    : 'They sign in with Google or GitHub, so there is no password to reset.';

  return (
    <SettingsSection title='Security'>
      {can('reset_password') && (
        <DetailRow label='Password' description={passwordDescription}>
          {user.hasPassword && (
            <Button variant='outline' size='sm' className='cursor-pointer' onClick={() => onDialog('reset-password')}>
              Reset password
            </Button>
          )}
        </DetailRow>
      )}
      {can('reset_two_factor') && (
        <DetailRow
          label='Two-factor authentication'
          description={
            user.twoFactorEnabled
              ? 'For a lost authenticator. They sign in with their password and set it up again.'
              : 'Not turned on for this account.'
          }
        >
          {user.twoFactorEnabled && (
            <Button variant='outline' size='sm' className='cursor-pointer' onClick={() => onDialog('reset-two-factor')}>
              Reset two-factor
            </Button>
          )}
        </DetailRow>
      )}
    </SettingsSection>
  );
}

function DangerZoneSection({ user, can, onDialog }: ActionSectionProps) {
  const { run, isPending } = useAdminMutation();
  const label = userDisplayName(user);
  const destructiveButton = 'text-destructive hover:text-destructive/80 cursor-pointer';

  if (user.isSelf) {
    return (
      <SettingsSection title='Danger zone'>
        <p className='text-muted-foreground text-sm'>
          You can&apos;t disable or delete your own account here. To delete it, use Settings, Account.
        </p>
      </SettingsSection>
    );
  }

  if (!can('disable') && !can('enable') && !can('delete')) return null;

  return (
    <SettingsSection title='Danger zone'>
      {user.status === 'disabled'
        ? can('enable') && (
            <DetailRow label='Enable account' description='Let them sign in and use their MCP tokens again.'>
              <Button
                variant='outline'
                size='sm'
                className='cursor-pointer'
                disabled={isPending}
                onClick={() => run(() => enableUserAction(user.id), { success: `${label} was enabled` })}
              >
                Enable
              </Button>
            </DetailRow>
          )
        : can('disable') && (
            <DetailRow
              label='Disable account'
              description="Sign them out everywhere and block sign-in. Nothing is deleted, and you can enable them again."
            >
              <Button variant='ghost' size='sm' className={destructiveButton} onClick={() => onDialog('disable')}>
                Disable
              </Button>
            </DetailRow>
          )}
      {can('delete') && (
        <DetailRow
          label='Delete user'
          description='Anonymize the account for good. You choose what happens to the dashboards they own.'
        >
          <Button variant='ghost' size='sm' className={destructiveButton} onClick={() => onDialog('delete')}>
            Delete
          </Button>
        </DetailRow>
      )}
    </SettingsSection>
  );
}

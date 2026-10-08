import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getAuthSession } from '@/auth/auth-actions';
import type { SupportedLanguages } from '@/constants/i18n';
import { isOpenInvitation, type InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { acceptInvitePath, signInPath, signUpPath } from '@/lib/auth/auth-page-state';
import { UserException } from '@/lib/exceptions';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { findUserByEmail } from '@/repositories/postgres/user.repository';
import { acceptInvitation } from '@/services/dashboard/invitation.service';
import { maskEmail } from '@/utils/maskEmail';
import { AuthAction, AuthPanel } from '@/landing/components/auth/authPanel';
import { NO_INDEX } from '@/landing/components/auth/metadata';
import { SwitchAccount } from '@/landing/components/auth/switchAccount';

type Props = { params: Promise<{ locale: SupportedLanguages; token: string }> };

export const metadata: Metadata = { title: 'Betterlytics', robots: NO_INDEX };

/**
 * An invitation link: accepted straight away when the right account is signed in, otherwise a panel saying why not.
 * Signed-out visitors go to sign-up (a new address, which the invitation unlocks) or sign-in, and come back here.
 */
export default async function AcceptInvitePage({ params }: Props) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const session = await getAuthSession();
  const t = await getTranslations('invitations.acceptPage');

  // Name only: the inviter's email never reaches the link holder (the invite email doesn't show it either)
  const inviterLabel = (invitation: InvitationWithInviter) => invitation.invitedBy.name || t('dashboardOwner');
  const invitedDashboard = (invitation: InvitationWithInviter) => `/dashboard/${invitation.dashboardId}?invited=1`;

  // the states that need no session: missing, cancelled or declined, and expired
  const statusPanelFor = (invitation: InvitationWithInviter | null) => {
    if (!invitation || invitation.status === 'cancelled' || invitation.status === 'declined') {
      return (
        <AuthPanel title={t('notFoundTitle')} lede={t('notFoundDescription')}>
          <AuthAction
            href={session ? '/dashboards' : '/signin'}
            label={session ? t('goToDashboards') : t('goToSignIn')}
          />
        </AuthPanel>
      );
    }
    if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
      return (
        <AuthPanel title={t('expiredTitle')} lede={t('expiredDescription')}>
          <AuthAction
            note={t('expiredHint', { inviter: inviterLabel(invitation) })}
            href={session ? '/dashboards' : '/signin'}
            label={session ? t('goToDashboards') : t('goToSignIn')}
          />
        </AuthPanel>
      );
    }
    return null;
  };

  const invitation = await findInvitationByToken(token);
  const statusPanel = statusPanelFor(invitation);
  if (statusPanel || !invitation) {
    return statusPanel;
  }

  // a new address goes to sign-up (the invitation unlocks it), an existing one to sign-in
  if (!session?.user?.email) {
    if (isOpenInvitation(invitation) && !(await findUserByEmail(invitation.email))) {
      redirect(`/${locale}${signUpPath(token)}`);
    }
    redirect(`/${locale}${signInPath(acceptInvitePath(token))}`);
  }

  if (invitation.email.toLowerCase() !== session.user.email.toLowerCase()) {
    return (
      <AuthPanel
        title={t('emailMismatchTitle')}
        lede={t('emailMismatchDescription', {
          invitedEmail: maskEmail(invitation.email),
          currentEmail: session.user.email,
        })}
      >
        <SwitchAccount
          note={t('emailMismatchHint')}
          continueHref={`/${locale}${acceptInvitePath(token)}`}
          label={t('signOutAndContinue')}
          stayHref='/dashboards'
          stayLabel={t('goToDashboards')}
        />
      </AuthPanel>
    );
  }

  if (invitation.status === 'accepted') {
    redirect(invitedDashboard(invitation));
  }

  // The service, not the action: the action's revalidatePath throws when run during render
  try {
    await acceptInvitation(token, session.user.id, session.user.email);
  } catch (error) {
    console.error('Failed to accept invitation from link:', { invitationId: invitation.id, error });

    // The invitation may have changed since we read it (accepted elsewhere, cancelled, expired)
    const current = await findInvitationByToken(token);
    if (current?.status === 'accepted') {
      redirect(invitedDashboard(invitation));
    }
    const currentStatusPanel = statusPanelFor(current);
    if (currentStatusPanel) {
      return currentStatusPanel;
    }

    return (
      <AuthPanel
        title={t('errorTitle')}
        lede={error instanceof UserException ? error.message : t('errorDescription')}
      >
        <AuthAction
          note={t('errorHint', { inviter: inviterLabel(invitation) })}
          href={acceptInvitePath(token)}
          label={t('tryAgain')}
          secondary={{ href: '/dashboards', label: t('goToDashboards') }}
        />
      </AuthPanel>
    );
  }

  redirect(invitedDashboard(invitation));
}

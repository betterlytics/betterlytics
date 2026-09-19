import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';
import { acceptInvitation } from '@/services/dashboard/invitation.service';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { findUserByEmail } from '@/repositories/postgres/user.repository';
import { isOpenInvitation, type InvitationWithInviter } from '@/entities/dashboard/invitation.entities';
import { UserException } from '@/lib/exceptions';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, Clock, LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Logo from '@/components/logo';

export async function generateMetadata() {
  return {
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-image-preview': 'none',
        'max-snippet': 0,
        'max-video-preview': 0,
      },
    },
  };
}

interface InviteStatusCardProps {
  icon: LucideIcon;
  iconVariant: 'destructive' | 'warning';
  title: string;
  description: string;
  hint?: string;
  actionLabel: string;
  actionHref: string;
  actionVariant?: 'default' | 'outline';
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
}

function InviteStatusCard({
  icon: Icon,
  iconVariant,
  title,
  description,
  hint,
  actionLabel,
  actionHref,
  actionVariant = 'outline',
  secondaryActionLabel,
  secondaryActionHref,
}: InviteStatusCardProps) {
  const iconStyles = {
    destructive: 'text-destructive',
    warning: 'text-warning',
  };

  return (
    <div className='flex flex-1 flex-col items-center justify-center p-4 py-12'>
      <Link href='/' className='mb-8 flex items-center space-x-2'>
        <Logo variant='simple' showText textSize='lg' priority />
      </Link>

      <Card className='w-full max-w-md py-4'>
        <CardContent className='space-y-4 pt-2'>
          <div className='space-y-2'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <Icon className={`size-5 shrink-0 ${iconStyles[iconVariant]}`} />
              {title}
            </CardTitle>
            <CardDescription className='text-sm leading-relaxed'>{description}</CardDescription>
          </div>

          <div className={`flex gap-4 pt-2 ${secondaryActionLabel ? 'flex-col' : 'items-center justify-between'}`}>
            {hint && <p className='text-muted-foreground/80 text-sm leading-relaxed'>{hint}</p>}
            <div className='ml-auto flex shrink-0 gap-2'>
              {secondaryActionLabel && secondaryActionHref && (
                <Button asChild variant='outline'>
                  <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
                </Button>
              )}
              <Button asChild variant={actionVariant}>
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AcceptInvitePageProps {
  params: Promise<{
    token: string;
    locale: string;
  }>;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token, locale } = await params;
  const session = await getAuthSession();
  const t = await getTranslations('invitations.acceptPage');

  // Name only: the inviter's email never reaches the link holder (the invite email doesn't show it either)
  const inviterLabel = (invitation: InvitationWithInviter) => invitation.invitedBy.name || t('dashboardOwner');

  // Cards for the states that need no session: missing/cancelled/declined and expired
  const statusCardFor = (invitation: InvitationWithInviter | null) => {
    if (!invitation || invitation.status === 'cancelled' || invitation.status === 'declined') {
      return (
        <InviteStatusCard
          icon={AlertCircle}
          iconVariant='destructive'
          title={t('notFoundTitle')}
          description={t('notFoundDescription')}
          actionLabel={session ? t('goToDashboards') : t('goToSignIn')}
          actionHref={session ? '/dashboards' : `/${locale}/signin`}
          actionVariant='default'
        />
      );
    }

    if (invitation.status === 'expired' || new Date() > invitation.expiresAt) {
      return (
        <InviteStatusCard
          icon={Clock}
          iconVariant='warning'
          title={t('expiredTitle')}
          description={t('expiredDescription')}
          hint={t('expiredHint', { inviter: inviterLabel(invitation) })}
          actionLabel={t('goToDashboards')}
          actionHref={'/dashboards'}
        />
      );
    }

    return null;
  };

  const invitation = await findInvitationByToken(token);
  const statusCard = statusCardFor(invitation);
  if (statusCard || !invitation) {
    return statusCard;
  }

  // New address goes to sign-up (the invitation unlocks it); existing ones to sign-in
  if (!session?.user?.email) {
    const returnTo = `/accept-invite/${token}`;
    if (isOpenInvitation(invitation) && !(await findUserByEmail(invitation.email))) {
      redirect(`/${locale}/signup?invite=${encodeURIComponent(token)}`);
    }
    redirect(`/${locale}/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }

  const isEmailMismatch = invitation.email.toLowerCase() !== session.user.email.toLowerCase();

  if (isEmailMismatch) {
    return (
      <InviteStatusCard
        icon={AlertCircle}
        iconVariant='destructive'
        title={t('emailMismatchTitle')}
        description={t('emailMismatchDescription', {
          invitedEmail: invitation.email,
          currentEmail: session.user.email,
        })}
        hint={t('emailMismatchHint')}
        actionLabel={t('goToDashboards')}
        actionHref={'/dashboards'}
      />
    );
  }

  if (invitation.status === 'accepted') {
    redirect(`/dashboard/${invitation.dashboardId}?invited=1`);
  }

  // The service, not the action: the action's revalidatePath throws when run during render
  try {
    await acceptInvitation(token, session.user.id, session.user.email);
  } catch (error) {
    console.error('Failed to accept invitation from link:', { invitationId: invitation.id, error });

    // The invitation may have changed since we read it (accepted elsewhere, cancelled, expired)
    const current = await findInvitationByToken(token);
    if (current?.status === 'accepted') {
      redirect(`/dashboard/${invitation.dashboardId}?invited=1`);
    }
    const currentStatusCard = statusCardFor(current);
    if (currentStatusCard) {
      return currentStatusCard;
    }

    return (
      <InviteStatusCard
        icon={AlertCircle}
        iconVariant='destructive'
        title={t('errorTitle')}
        description={error instanceof UserException ? error.message : t('errorDescription')}
        hint={t('errorHint', { inviter: inviterLabel(invitation) })}
        actionLabel={t('tryAgain')}
        actionHref={`/${locale}/accept-invite/${token}`}
        actionVariant='default'
        secondaryActionLabel={t('goToDashboards')}
        secondaryActionHref={'/dashboards'}
      />
    );
  }

  redirect(`/dashboard/${invitation.dashboardId}?invited=1`);
}

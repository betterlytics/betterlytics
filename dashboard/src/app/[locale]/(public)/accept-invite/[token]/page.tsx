import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';
import { acceptInvitation } from '@/services/dashboard/invitation.service';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, Clock, LucideIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Logo from '@/components/logo';

interface InviteStatusCardProps {
  icon: LucideIcon;
  iconVariant: 'destructive' | 'warning';
  title: string;
  description: string;
  hint?: string;
  actionLabel: string;
  actionHref: string;
  actionVariant?: 'default' | 'outline';
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
}: InviteStatusCardProps) {
  const iconStyles = {
    destructive: 'bg-destructive/10 text-destructive border-destructive/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <div className='flex flex-1 flex-col items-center justify-center p-4 py-12'>
      <Link href='/' className='mb-8 flex items-center space-x-2'>
        <Logo variant='simple' showText textSize='lg' priority />
      </Link>

      <Card className='w-full max-w-md py-4'>
        <CardContent className='pt-6'>
          <div className='flex items-start gap-4'>
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${iconStyles[iconVariant]}`}
            >
              <Icon className='size-5' />
            </div>
            <div className='flex-1 space-y-1'>
              <CardTitle className='text-lg leading-tight'>{title}</CardTitle>
              <CardDescription className='text-sm leading-relaxed'>{description}</CardDescription>
            </div>
          </div>

          <div className='mt-6 flex items-center justify-between gap-4'>
            {hint && <p className='text-muted-foreground/80 text-sm leading-relaxed'>{hint}</p>}
            <Button asChild variant={actionVariant} className='ml-auto shrink-0'>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
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

  const invitation = await findInvitationByToken(token);
  if (!invitation || invitation.status === 'cancelled' || invitation.status === 'declined') {
    return (
      <InviteStatusCard
        icon={AlertCircle}
        iconVariant='destructive'
        title={t('notFoundTitle')}
        description={t('notFoundDescription')}
        actionLabel={t('goToSignIn')}
        actionHref={`/${locale}/signin`}
        actionVariant='default'
      />
    );
  }

  if (!session?.user?.email) {
    redirect(`/${locale}/signin`);
  }

  const isExpired = new Date() > invitation.expiresAt;
  const isEmailMismatch = invitation.email.toLowerCase() !== session.user.email.toLowerCase();

  if (isExpired || invitation.status === 'expired') {
    return (
      <InviteStatusCard
        icon={Clock}
        iconVariant='warning'
        title={t('expiredTitle')}
        description={t('expiredDescription')}
        hint={t('expiredHint')}
        actionLabel={t('goToDashboards')}
        actionHref={`/${locale}/dashboards`}
      />
    );
  }

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
        actionHref={`/${locale}/dashboards`}
      />
    );
  }

  if (invitation.status === 'accepted') {
    redirect(`/dashboard/${invitation.dashboardId}`);
  }

  try {
    await acceptInvitation(token, session.user.id, session.user.email);
  } catch (error) {
    return (
      <InviteStatusCard
        icon={AlertCircle}
        iconVariant='destructive'
        title={t('errorTitle')}
        description={t('errorDescription')}
        actionLabel={t('goToDashboards')}
        actionHref={`/${locale}/dashboards`}
      />
    );
  }

  redirect(`/dashboard/${invitation.dashboardId}`);
}

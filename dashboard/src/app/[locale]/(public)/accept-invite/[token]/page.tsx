import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';
import { acceptInvitation } from '@/services/dashboard/invitation.service';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { UserException } from '@/lib/exceptions';
import { getTranslations } from 'next-intl/server';

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

  if (
    !invitation ||
    invitation.status === 'cancelled' ||
    invitation.status === 'expired' ||
    invitation.status === 'declined'
  ) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full'>
              <AlertCircle className='text-destructive size-6' />
            </div>
            <CardTitle>{t('notFoundTitle')}</CardTitle>
            <CardDescription>{t('notFoundDescription')}</CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <Button asChild>
              <Link href={`/${locale}/signin`}>{t('goToSignIn')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user?.email) {
    redirect(`/${locale}/signin`);
  }

  if (invitation.email === session.user.email && invitation.status === 'accepted') {
    redirect(`/dashboard/${invitation.dashboardId}`);
  }

  try {
    const dashboardId = await acceptInvitation(token, session.user.id, session.user.email);
    redirect(`/dashboard/${dashboardId}`);
  } catch (error) {
    const errorMessage =
      error instanceof UserException ? error.message : 'An error occurred while accepting the invitation.';

    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full'>
              <AlertCircle className='text-destructive size-6' />
            </div>
            <CardTitle>{t('errorTitle')}</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-center'>
            <p className='text-muted-foreground text-sm'>
              {t('emailMismatch', { invitedEmail: invitation.email, currentEmail: session.user.email })}
            </p>
            <div className='flex flex-col gap-2'>
              <Button asChild variant='outline'>
                <Link href={`/${locale}/dashboards`}>{t('goToDashboards')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

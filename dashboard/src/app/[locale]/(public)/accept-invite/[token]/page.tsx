import { redirect } from 'next/navigation';
import { getAuthSession } from '@/auth/auth-actions';
import { acceptInvitation } from '@/services/dashboard/invitation.service';
import { findInvitationByToken } from '@/repositories/postgres/invitation.repository';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { UserException } from '@/lib/exceptions';

interface AcceptInvitePageProps {
  params: Promise<{
    token: string;
    locale: string;
  }>;
}

export default async function AcceptInvitePage({ params }: AcceptInvitePageProps) {
  const { token, locale } = await params;
  const session = await getAuthSession();

  const invitation = await findInvitationByToken(token);

  if (!invitation) {
    return (
      <div className='flex min-h-screen items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='bg-destructive/10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full'>
              <AlertCircle className='text-destructive size-6' />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>This invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <Button asChild>
              <Link href={`/${locale}/signin`}>Go to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user?.email) {
    redirect(`/${locale}/signin`);
  }

  try {
    const dashboardId = await acceptInvitation(token, session.user.id, session.user.email);
    redirect(`/${locale}/dashboard/${dashboardId}`);
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
            <CardTitle>Could Not Accept Invitation</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3 text-center'>
            <p className='text-muted-foreground text-sm'>
              This invitation was sent to <strong>{invitation.email}</strong>. You are signed in as{' '}
              <strong>{session.user.email}</strong>.
            </p>
            <div className='flex flex-col gap-2'>
              <Button asChild variant='outline'>
                <Link href={`/${locale}/dashboards`}>Go to Dashboards</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}

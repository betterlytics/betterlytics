import Link from 'next/link';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getServerSession } from 'next-auth';
import { notFound, redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import ExternalLink from '@/components/ExternalLink';

interface SuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  if (!isClientFeatureEnabled('enableBilling')) {
    return notFound();
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/signin');
  }

  const resolvedSearchParams = await searchParams;
  const sessionId = resolvedSearchParams.session_id;

  if (!sessionId) {
    redirect('/billing');
  }

  return (
    <div className='bg-background flex pt-24'>
      <div className='container mx-auto max-w-2xl px-4 py-16'>
        <div className='space-y-8 text-center'>
          <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
            <CheckCircle className='h-8 w-8 text-green-600' />
          </div>

          <div className='space-y-4'>
            <h1 className='text-3xl font-bold'>Payment Successful!</h1>
            <p className='text-muted-foreground text-lg'>
              Thank you for subscribing to Betterlytics. Your payment has been processed successfully.
            </p>
          </div>

          <Card className='bg-card'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>What&apos;s next?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='text-muted-foreground space-y-2 text-left text-sm'>
                <li>Your subscription is now active</li>
                <li>You&apos;ll receive a confirmation email shortly</li>
                <li>Your increased event limits are effective immediately</li>
                <li>Access your billing details in User Settings</li>
                <li>
                  <ExternalLink
                    href='/docs'
                    title='Complete Betterlytics Documentation'
                    className='text-primary font-medium hover:underline'
                  >
                    Check out our documentation
                  </ExternalLink>{' '}
                  to get the most out of Betterlytics
                </li>
              </ul>
            </CardContent>
          </Card>

          {sessionId && <div className='text-muted-foreground text-xs'>Session ID: {sessionId}</div>}

          <div className='flex flex-col justify-center gap-4 sm:flex-row'>
            <Button asChild>
              <Link href='/dashboard'>Go to Dashboard</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/billing'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Billing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

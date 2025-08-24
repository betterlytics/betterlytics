'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createDashboardAction } from '@/app/actions/dashboard';
import { domainValidation } from '@/entities/dashboard';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function WebsiteSetupPage() {
  const { state, updateWebsite, setSiteId, setDashboardId } = useOnboarding();
  const { data: session } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Redirect to account step if no session
  useEffect(() => {
    if (!session?.user) {
      router.push('/onboarding/account');
    }
  }, [session, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      const formData = new FormData(e.currentTarget);
      const domain = formData.get('domain') as string;

      const domainResult = domainValidation.safeParse(domain);
      if (!domainResult.success) {
        setError(domainResult.error.errors[0]?.message || 'Invalid domain');
        return;
      }

      startTransition(async () => {
        const result = await createDashboardAction(domainResult.data);

        if (!result.success) {
          setError('Failed to create dashboard. Please try again.');
          return;
        }

        updateWebsite({
          domain: domainResult.data,
        });

        setDashboardId(result.data.id);
        setSiteId(result.data.siteId);
        toast.success('Dashboard created successfully!');
        router.push('/onboarding/integration');
      });
    },
    [updateWebsite, setSiteId, setDashboardId, router],
  );

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h2 className='text-2xl font-semibold'>Set up your website</h2>
        <p className='text-muted-foreground mt-2'>Tell us about the website you want to track</p>
      </div>

      {error && (
        <div
          className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
          role='alert'
        >
          <span className='block sm:inline'>{error}</span>
        </div>
      )}

      <form className='space-y-6' onSubmit={handleSubmit}>
        <Card>
          <CardHeader className='flex flex-row items-start space-y-0 space-x-3'>
            <Globe className='mt-1 h-5 w-5 flex-shrink-0 text-blue-500' />
            <div>
              <CardTitle className='text-base font-medium'>Website Details</CardTitle>
              <CardDescription className='text-sm'>
                Basic information about your website or application
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='domain'>Domain</Label>
              <Input
                id='domain'
                name='domain'
                type='text'
                required
                defaultValue={state.website.domain || ''}
                placeholder='example.com'
                disabled={isPending}
              />
              <p className='text-muted-foreground text-xs'>
                Enter your domain without https:// or www. (e.g., example.com)
              </p>
            </div>
          </CardContent>
        </Card>


        <div className='flex justify-end pt-4'>
          <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
            {isPending ? 'Creating Dashboard...' : 'Create Dashboard'}
          </Button>
        </div>
      </form>
    </div>
  );
}

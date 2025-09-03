'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createDashboardAction, getFirstUserDashboardAction } from '@/app/actions/dashboard';
import { domainValidation } from '@/entities/dashboard';
import { toast } from 'sonner';
import { PrefixInput } from '@/components/inputs/PrefixInput';

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
      return;
    }
    getFirstUserDashboardAction()
      .then((response) => {
        if (response.success && response.data) {
          router.push('/onboarding/integration');
        }
      })
      .catch(() => {});
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
    <div className='flex justify-center'>
      <div className='bg-card space-y-6 rounded-lg border p-6 md:w-xl'>
        <div>
          <h2 className='text-2xl font-semibold'>Set up your website</h2>
          <p className='text-muted-foreground mt-2'>Tell us about the website you want to track</p>
        </div>

        <form className='space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-2'>
            <Label htmlFor='domain'>Domain</Label>
            <PrefixInput
              id='domain'
              name='domain'
              type='text'
              required
              defaultValue={state.website.domain || ''}
              placeholder='example.com'
              disabled={isPending}
              prefix='https://'
            />
            <p className='text-muted-foreground text-xs'>
              Enter your domain without https:// or www. (e.g., example.com)
            </p>
          </div>
          {error && (
            <div
              className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
              role='alert'
            >
              <span className='block sm:inline'>{error}</span>
            </div>
          )}

          <div className='flex justify-end pt-4'>
            <Button type='submit' disabled={isPending} className='w-full sm:w-auto'>
              {isPending ? 'Creating Dashboard...' : 'Create Dashboard'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createDashboardAction } from '@/app/actions/dashboard';
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
    <div className='grid grid-cols-2 gap-4'>
      <div className='hidden md:block'>
        <img src={'/onboarding/image.png'} alt={'Visual graph'} className='object-fit h-full w-full blur-[4px]' />
      </div>
      <div className='bg-card col-span-2 space-y-3 rounded-lg border p-6 shadow-sm md:col-span-1'>
        <div className='text-center'>
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

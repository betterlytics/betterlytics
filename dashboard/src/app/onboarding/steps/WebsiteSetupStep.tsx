'use client';

import { useState, useTransition, useCallback } from 'react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createDashboardAction } from '@/app/actions/dashboard';
import { domainValidation } from '@/entities/dashboard';
import { Globe, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function WebsiteSetupStep() {
  const { state, updateWebsite, setSiteId, setDashboardId, nextStep } = useOnboarding();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      const formData = new FormData(e.currentTarget);
      const websiteName = formData.get('websiteName') as string;
      const domain = formData.get('domain') as string;

      if (!websiteName.trim()) {
        setError('Website name is required');
        return;
      }

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
          websiteName,
          domain: domainResult.data,
        });

        setDashboardId(result.data.id);
        setSiteId(result.data.siteId);
        toast.success('Dashboard created successfully!');
        nextStep();
      });
    },
    [updateWebsite, setSiteId, nextStep],
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
              <Label htmlFor='websiteName'>Website Name</Label>
              <Input
                id='websiteName'
                name='websiteName'
                type='text'
                required
                defaultValue={state.website.websiteName || ''}
                placeholder='My Awesome Website'
                disabled={isPending}
              />
              <p className='text-muted-foreground text-xs'>
                A friendly name for your website that will appear in your dashboard
              </p>
            </div>

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

        <Card className='border-dashed'>
          <CardHeader className='flex flex-row items-start space-y-0 space-x-3'>
            <Zap className='mt-1 h-5 w-5 flex-shrink-0 text-yellow-500' />
            <div>
              <CardTitle className='text-base font-medium'>Ready to Track</CardTitle>
              <CardDescription className='text-sm'>
                Once you continue, we'll create your analytics dashboard and provide you with tracking code
              </CardDescription>
            </div>
          </CardHeader>
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

'use client';

import { useState, useTransition, useCallback, Dispatch } from 'react';
import { useOnboarding } from '@/contexts/OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { createDashboardAction } from '@/app/actions/dashboard';
import { domainValidation } from '@/entities/dashboard';
import { toast } from 'sonner';
import { PrefixInput } from '@/components/inputs/PrefixInput';
import { useTranslations } from 'next-intl';

type WebsiteSetupProps = {
  onNext: Dispatch<void>;
};

export default function WebsiteSetup({ onNext }: WebsiteSetupProps) {
  const { state, updateWebsite, setSiteId, setDashboardId } = useOnboarding();
  const t = useTranslations('onboarding.website');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

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
          setError(t('failedToCreateDashboard'));
          return;
        }

        updateWebsite({
          domain: domainResult.data,
        });

        setDashboardId(result.data.id);
        setSiteId(result.data.siteId);
        toast.success(t('dashboardCreatedSuccess'));

        onNext();
      });
    },
    [updateWebsite, setSiteId, setDashboardId],
  );

  return (
    <div className='flex justify-center'>
      <div className='bg-card space-y-6 rounded-lg border p-6 md:w-xl'>
        <div>
          <h2 className='text-2xl font-semibold'>{t('title')}</h2>
          <p className='text-muted-foreground mt-2'>{t('description')}</p>
        </div>

        <form className='space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-2'>
            <Label htmlFor='domain'>{t('domainLabel')}</Label>
            <PrefixInput
              id='domain'
              name='domain'
              type='text'
              required
              defaultValue={state.website.domain || ''}
              placeholder={t('domainPlaceholder')}
              disabled={isPending}
              prefix='https://'
            />
            <p className='text-muted-foreground text-xs'>{t('domainHelp')}</p>
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
            <Button type='submit' disabled={isPending} className='h-10 w-full cursor-pointer rounded-xl sm:w-auto'>
              {isPending ? t('creatingDashboard') : t('createDashboardButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

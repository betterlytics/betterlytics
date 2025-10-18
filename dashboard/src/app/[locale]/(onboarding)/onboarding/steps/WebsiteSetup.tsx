'use client';

import { useState, useTransition, useCallback, Dispatch } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { completeOnboardingAndCreateDashboardAction } from '@/app/actions/onboarding';
import { domainValidation } from '@/entities/dashboard';
import { toast } from 'sonner';
import { PrefixInput } from '@/components/inputs/PrefixInput';
import { useTranslations } from 'next-intl';
import { useOnboarding } from '../OnboardingProvider';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from 'next-auth/react';

type WebsiteSetupProps = {
  onNext: Dispatch<void>;
  showOauthTos?: boolean;
};

export default function WebsiteSetup({ onNext, showOauthTos }: WebsiteSetupProps) {
  const t = useTranslations('onboarding.website');
  const tValidation = useTranslations('validation');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [agree, setAgree] = useState(false);

  const { setDashboard } = useOnboarding();
  const { update } = useSession();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      if (showOauthTos && !agree) {
        setError(tValidation('termsOfServiceRequired'));
        return;
      }

      const formData = new FormData(e.currentTarget);
      const domain = formData.get('domain') as string;

      const domainResult = domainValidation.safeParse(domain);
      if (!domainResult.success) {
        setError(domainResult.error.errors[0]?.message || 'Invalid domain');
        return;
      }

      startTransition(async () => {
        const result = await completeOnboardingAndCreateDashboardAction({
          domain: domainResult.data,
          acceptTerms: showOauthTos ? agree : undefined,
        });

        if (!result.success) {
          setError(result.error.message);
          return;
        }

        try {
          await update();
        } catch {}

        setDashboard(result.data);
        toast.success(t('dashboardCreatedSuccess'));
        onNext();
      });
    },
    [agree, showOauthTos, t, tValidation, setDashboard, onNext],
  );

  return (
    <div className='flex justify-center'>
      <div className='bg-card space-y-6 rounded-lg border p-3 py-4 pb-5 shadow-sm sm:p-6 md:w-xl'>
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
              placeholder={t('domainPlaceholder')}
              disabled={isPending}
              prefix='https://'
            />
            <p className='text-muted-foreground text-xs'>{t('domainHelp')}</p>
          </div>
          {showOauthTos && (
            <div className='flex items-start gap-2'>
              <Checkbox
                id='agree-terms'
                checked={agree}
                onCheckedChange={(v) => setAgree(Boolean(v))}
                aria-required={true}
              />
              <Label htmlFor='agree-terms' className='text-sm font-normal'>
                {t.rich('oauthAgreeLabel', {
                  termsLink: (chunks) => (
                    <a href='/terms' target='_blank' rel='noopener noreferrer' className='underline'>
                      {chunks}
                    </a>
                  ),
                  privacyLink: (chunks) => (
                    <a href='/privacy' target='_blank' rel='noopener noreferrer' className='underline'>
                      {chunks}
                    </a>
                  ),
                })}
              </Label>
            </div>
          )}
          {error && (
            <div
              className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-3'
              role='alert'
            >
              <span className='block sm:inline'>{error}</span>
            </div>
          )}

          <div className='flex justify-end pt-4'>
            <Button type='submit' disabled={isPending} className='h-10 w-full cursor-pointer rounded-md sm:w-auto'>
              {isPending ? t('creatingDashboard') : t('createDashboardButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition, useCallback, Dispatch } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { completeOnboardingAndCreateDashboardAction } from '@/app/actions/account/onboarding';
import { domainValidation } from '@/entities/dashboard';
import { toast } from 'sonner';
import { PrefixInput } from '@/components/inputs/PrefixInput';
import { useTranslations, useLocale } from 'next-intl';
import { useOnboarding } from '../OnboardingProvider';
import { Checkbox } from '@/components/ui/checkbox';
import { useSession } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { baEvent } from '@/lib/ba-event';

type WebsiteSetupProps = {
  onNext: Dispatch<void>;
};

export default function WebsiteSetup({ onNext }: WebsiteSetupProps) {
  const t = useTranslations('onboarding.website');
  const tValidation = useTranslations('validation');
  const locale = useLocale();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [agree, setAgree] = useState(false);
  const { data: session } = useSession();

  const effectiveShowTos = !session?.user?.termsAcceptedAt;

  const { setDashboard } = useOnboarding();
  const { update } = useSession();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError('');

      if (effectiveShowTos && !agree) {
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
          acceptTerms: effectiveShowTos ? agree : undefined,
          language: locale,
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
        baEvent('onboarding-website-setup');
        onNext();
      });
    },
    [agree, effectiveShowTos, t, tValidation, setDashboard, onNext],
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
          {effectiveShowTos && (
            <div className='flex items-start gap-2'>
              <Checkbox
                id='agree-terms'
                checked={agree}
                onCheckedChange={(v) => setAgree(Boolean(v))}
                aria-required={true}
              />
              <Label htmlFor='agree-terms' className='gap-0 text-sm leading-snug font-normal'>
                <span>
                  {t.rich('termsAgreeLabel', {
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
                </span>
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
            {effectiveShowTos && !agree ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='block w-full sm:w-auto'>
                      <Button
                        type='submit'
                        disabled
                        aria-disabled='true'
                        className='h-10 w-full cursor-pointer rounded-md sm:w-auto'
                      >
                        {t('createDashboardButton')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side='top'>{tValidation('termsOfServiceRequired')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                type='submit'
                disabled={isPending}
                className='h-10 w-full cursor-pointer rounded-md sm:w-auto'
              >
                {isPending ? t('creatingDashboard') : t('createDashboardButton')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

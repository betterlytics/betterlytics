'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from '@/app/actions/verification';
import { toast } from 'sonner';
import { Mail, X, AlertCircle, RotateCcw } from 'lucide-react';
import { getDisplayName } from '@/utils/userUtils';
import { useTranslations } from 'next-intl';

interface VerificationBannerProps {
  email: string;
  userName?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
  className?: string;
}

export function VerificationBanner({
  email,
  userName,
  onDismiss,
  showDismiss = true,
  className = '',
}: VerificationBannerProps) {
  const t = useTranslations('components.accountVerification.banner');
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResendVerification = async () => {
    startTransition(async () => {
      try {
        const result = await resendVerificationEmailAction({ email });

        if (result.success) {
          toast.success(t('toastSuccess'));
          setEmailSent(true);
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error(t('toastFailure'));
      }
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div
      className={`rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50 ${className}`}
    >
      <div className='flex items-start gap-3'>
        <AlertCircle className='mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400' />

        <div className='min-w-0 flex-1'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-blue-900 dark:text-blue-100'>{t('title')}</h3>
              <p className='mt-1 text-sm text-blue-700 dark:text-blue-200'>
                {t.rich('body', {
                  name: getDisplayName(userName, email),
                  email,
                  strong: (chunks) => <span className='font-medium'>{chunks}</span>,
                })}
              </p>
            </div>

            {showDismiss && (
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDismiss}
                className='h-8 w-8 flex-shrink-0 cursor-pointer p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>{t('dismiss')}</span>
              </Button>
            )}
          </div>

          <div className='mt-3 flex flex-wrap items-center gap-3'>
            {!emailSent ? (
              <Button
                variant='outline'
                size='sm'
                onClick={handleResendVerification}
                disabled={isPending}
                className='flex cursor-pointer items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-900/50'
              >
                <Mail className='h-4 w-4' />
                {isPending ? t('sending') : t('resend')}
              </Button>
            ) : (
              <div className='flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400'>
                <RotateCcw className='h-4 w-4' />
                <span>{t('sentLabel')}</span>
              </div>
            )}
          </div>

          <p className='mt-2 text-xs text-blue-600 dark:text-blue-400'>{t('help')}</p>
        </div>
      </div>
    </div>
  );
}

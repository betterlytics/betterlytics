'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from '@/app/actions/verification';
import { toast } from 'sonner';
import { ShieldCheck, Mail, CheckCircle } from 'lucide-react';
import { getDisplayName } from '@/utils/userUtils';
import { useTranslations } from 'next-intl';

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
}

export function VerificationRequiredModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: VerificationRequiredModalProps) {
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);
  const t = useTranslations('components.accountVerification.requiredModal');

  const handleResendVerification = () => {
    startTransition(async () => {
      try {
        const result = await resendVerificationEmailAction({ email: userEmail });

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <div className='mb-2 flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50'>
              <ShieldCheck className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <DialogTitle className='text-lg'>{t('title')}</DialogTitle>
              <DialogDescription>{t('subtitle')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-lg bg-blue-50 p-4 dark:bg-blue-950/50'>
            <h3 className='mb-2 font-medium text-blue-900 dark:text-blue-100'>{t('whyTitle')}</h3>
            <ul className='space-y-1 text-sm text-blue-700 dark:text-blue-200'>
              <li className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400' />
                <span>{t('whyItems.secureBilling')}</span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400' />
                <span>{t('whyItems.notifications')}</span>
              </li>
              <li className='flex items-start gap-2'>
                <CheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400' />
                <span>{t('whyItems.security')}</span>
              </li>
            </ul>
          </div>

          <div className='text-center'>
            <p className='text-muted-foreground mb-4 text-sm'>
              {t.rich('verifyLine', {
                name: getDisplayName(userName, userEmail),
                email: userEmail,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            {!emailSent ? (
              <Button onClick={handleResendVerification} disabled={isPending} className='w-full' size='lg'>
                <Mail className='mr-2 h-4 w-4' />
                {isPending ? t('sending') : t('resend')}
              </Button>
            ) : (
              <div className='space-y-3'>
                <div className='flex items-center justify-center gap-2 text-green-600 dark:text-green-400'>
                  <CheckCircle className='h-4 w-4' />
                  <span className='text-sm font-medium'>{t('sentTitle')}</span>
                </div>
                <p className='text-muted-foreground text-xs'>{t('sentInfo')}</p>
              </div>
            )}
          </div>

          <div className='flex'>
            <Button variant='outline' onClick={onClose} className='flex-1'>
              {t('cancel')}
            </Button>
            {emailSent && (
              <Button onClick={onClose} className='flex-1'>
                {t('continue')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

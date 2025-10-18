'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { acceptTermsAction } from '@/app/actions/legal';
import { signOut, useSession } from 'next-auth/react';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { useRouter } from 'next/navigation';

interface TermsRequiredModalProps {
  isOpen: boolean;
}

export function TermsRequiredModal({ isOpen }: TermsRequiredModalProps) {
  const t = useTranslations('components.termsRequiredDialog');
  const tValidation = useTranslations('validation');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const { refreshSession } = useSessionRefresh();
  const router = useRouter();

  const handleAccept = () => {
    setError('');
    startTransition(async () => {
      try {
        const result = await acceptTermsAction();
        if (!result.success) {
          setError(tValidation('termsOfServiceRequired'));
        } else {
          await refreshSession();
          router.refresh();
        }
      } catch (e) {
        setError(tValidation('termsOfServiceRequired'));
      }
    });
  };

  const handleLogout = () => {
    void signOut({ callbackUrl: '/signin' });
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className='max-w-md [&>button]:hidden'
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t.rich('body', {
              termsLink: (chunks) => (
                <a href='/terms' target='_blank' rel='noopener noreferrer' className='underline'>
                  {chunks}
                </a>
              ),
            })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className='bg-destructive/10 border-destructive/20 text-destructive rounded-md border px-4 py-2 text-sm'>
            {error}
          </div>
        )}

        <div className='mt-4 flex w-full items-center justify-between gap-3'>
          <Button variant='outline' onClick={handleLogout} className='cursor-pointer px-3'>
            {t('logout')}
          </Button>
          <Button onClick={handleAccept} disabled={isPending} className='min-w-[10rem] cursor-pointer'>
            {t('acceptAndContinue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

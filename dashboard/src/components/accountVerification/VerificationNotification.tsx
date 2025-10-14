'use client';

import { useEffect, useTransition } from 'react';
import { useNotificationsContext } from '@/contexts/NotificationProvider';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from '@/app/actions/verification';
import { toast } from 'sonner';

type VerificationNotificationHandlerProps = {
  email: string;
  userName?: string;
  showDismiss?: boolean;
};

export function VerificationNotificationHandler({
  email,
  showDismiss = true,
}: VerificationNotificationHandlerProps) {
  const t = useTranslations('banners.verifyEmail');
  const { addNotification, removeNotification } = useNotificationsContext();
  const [isPending, startTransition] = useTransition();

  const handleResendVerification = () => {
    startTransition(async () => {
      try {
        const result = await resendVerificationEmailAction({ email });
        if (result.success) {
          toast.success(t('success'));
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error(t('failure'));
      }
    });
  };

  useEffect(() => {
    addNotification({
      id: 'verify-email',
      level: 'info',
      title: t('title'),
      description: t.rich('description', { email, strong: (chunks) => <strong>{chunks}</strong> }),
      action: (
        <Button
          variant='default'
          className='bg-primary text-primary-foreground hover:bg-primary/40 cursor-pointer border-1 border-white shadow-md'
          size='sm'
          disabled={isPending}
          onClick={handleResendVerification}
        >
          {isPending ? t('sending') : t('resend')}
        </Button>
      ),
      dismissible: showDismiss,
    });

    return () => removeNotification('verify-email');
  }, [addNotification, removeNotification, showDismiss, t]);

  return null;
}

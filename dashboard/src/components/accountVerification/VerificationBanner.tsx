'use client';

import { useEffect, useState } from 'react';
import { useBannerContext } from '@/contexts/BannerProvider';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from '@/app/actions/verification';
import { toast } from 'sonner';

type VerificationBannerProps = {
  email: string;
  isVerified: boolean;
  userName?: string;
  showDismiss?: boolean;
};

export function VerificationBanner({ email, isVerified, showDismiss = true }: VerificationBannerProps) {
  const t = useTranslations('banners.verifyEmail');
  const { addBanner, removeBanner } = useBannerContext();
  const [isSending, setIsSending] = useState(false);

  const buildBanner = (sending: boolean) => ({
    id: 'verify-email',
    level: 'info' as const,
    title: t('title'),
    description: t.rich('description', { email, strong: (chunks) => <strong>{chunks}</strong> }),
    action: (
      <Button
        variant='default'
        className='bg-primary text-primary-foreground hover:bg-primary/40 cursor-pointer border-1 border-white shadow-md'
        size='sm'
        disabled={sending}
        onClick={!sending ? handleResendVerification : undefined}
      >
        {sending ? t('sending') : t('resend')}
      </Button>
    ),
    dismissible: showDismiss,
  });

  const handleResendVerification = async () => {
    setIsSending(true);
    try {
      const result = await resendVerificationEmailAction({ email });
      if (result.success) {
        toast.success(t('success'));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(t('failure'));
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!email || isVerified) {
      removeBanner('verify-email');
      return;
    }
    addBanner({ ...buildBanner(false), scope: 'global', sticky: true });
    return () => removeBanner('verify-email');
  }, [email, isVerified, addBanner, removeBanner, t]);

  useEffect(() => {
    if (!email || isVerified) {
      removeBanner('verify-email');
      return;
    }
    addBanner({ ...buildBanner(isSending), scope: 'global', sticky: true });
  }, [email, isVerified, isSending, addBanner, removeBanner]);

  return null;
}

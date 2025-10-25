import { disableTotpAction, enableTotpAction, setupTotpAction } from '@/app/actions/totp';
import SettingsCard from '@/components/SettingsCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import OtpInput from '@/components/ui/otp-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Clipboard, KeySquare, Loader2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState, useTransition } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';

function SetupTotp() {
  const t = useTranslations('components.userSettings.security.totp');
  const totpInputRef = useRef<HTMLInputElement>(null);
  const { update: setSession } = useSession();
  const [totp, setTotp] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUrl, setTotpUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [totpSecretCopied, setTotpSecretCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      return setIsDialogOpen(false);
    }

    setTotp('');

    if (totpUrl) {
      setIsDialogOpen(open);
    } else {
      startTransition(async () => {
        const url = await setupTotpAction();
        if (url.success) {
          setTotpUrl(url.data);
          setIsDialogOpen(open);
        } else {
          toast.error('Failed to setup two-factor authentication. Please try again.');
        }
      });
    }
  };

  const handleDialogOpenAutoFocus = (e: Event) => {
    e.preventDefault();
    totpInputRef.current?.focus();
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTotpSecretCopied(true);
      setTimeout(() => setTotpSecretCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const enabled = await enableTotpAction(totp);
      if (enabled.success) {
        await setSession({ totpEnabled: true });
        setIsDialogOpen(false);
        toast.success('Two-factor authentication enabled successfully');
      } else {
        setTotp('');
        totpInputRef.current?.focus();
        toast.error('Failed to enable two-factor authentication. Please try again.');
      }
    });
  };

  useEffect(() => {
    if (!totpUrl) {
      return;
    }

    const secret = new URL(totpUrl).searchParams.get('secret');
    if (!secret) {
      return;
    }
    setTotpSecret(secret);
  }, [totpUrl]);

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <AlertDialogTrigger asChild>
        <Button className='w-full cursor-pointer sm:w-auto' disabled={isPending || isDialogOpen}>
          {isPending || isDialogOpen ? <Loader2 className='h-4 w-4 animate-spin' /> : t('enable')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className='max-h-[90vh] w-86 overflow-y-auto'
        onOpenAutoFocus={handleDialogOpenAutoFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t('enable')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich('instructions', {
              setup: (chunk) => (
                <Tooltip>
                  <TooltipTrigger asChild className='border-b-primary cursor-pointer border-0 border-b-2'>
                    <strong>{chunk}</strong>
                  </TooltipTrigger>
                  <TooltipContent className='flex flex-row items-center'>
                    <code>{totpSecret}</code>
                    <button className='ms-2 block cursor-pointer py-0.5' onClick={() => handleCopy(totpSecret)}>
                      {totpSecretCopied ? <Check className='size-3' /> : <Clipboard className='size-3' />}
                    </button>
                  </TooltipContent>
                </Tooltip>
              ),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleOnSubmit}>
          <div className='mb-4 flex flex-col justify-between gap-4'>
            <ExternalLink href={totpUrl} className='m-auto'>
              <QRCode value={totpUrl} size={128} className='m-auto' />
            </ExternalLink>
            <OtpInput value={totp} onValueChange={setTotp} disabled={isPending} ref={totpInputRef} />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
              {t('cancel')}
            </AlertDialogCancel>
            <Button type='submit' disabled={isPending || totp.length !== 6} className='cursor-pointer'>
              {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : t('confirm')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DisableTotp() {
  const t = useTranslations('components.userSettings.security.totp');
  const { update: setSession } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDisableTotp = () => {
    startTransition(async () => {
      const disabled = await disableTotpAction();
      if (disabled.success) {
        await setSession({ totpEnabled: false });
        setIsDialogOpen(false);
        toast.success(t('disabledSuccess'));
      } else {
        toast.error(t('disableFailed'));
      }
    });
  };

  return (
    <div className='flex space-x-2'>
      <div className='flex items-center gap-1 text-sm text-green-600'>
        <Check className='h-3 w-3' />
        <span>{t('enabled')}</span>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant='link' disabled={isPending} className='text-muted-foreground cursor-pointer'>
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className='w-80'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>{t('disableTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('disableDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableTotp}
              disabled={isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : t('disable')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UserSecurityTotpSettings() {
  const { data: session } = useSession();
  const t = useTranslations('components.userSettings.security.totp');

  return (
    <SettingsCard icon={KeySquare} title={t('title')} description={t('description')}>
      {session?.user.totpEnabled ? <DisableTotp /> : <SetupTotp />}
    </SettingsCard>
  );
}

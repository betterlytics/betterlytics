'use client';

import SettingRow from '../shared/SettingRow';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OtpInput from '@/components/ui/otp-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { Check, Clipboard, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useCopy } from '@/hooks/use-copy';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { useEffect, useRef, useState, useTransition } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';

function SetupTotp() {
  const t = useTranslations('components.userSettings.security.totp');
  const { refreshSession } = useSessionRefresh();
  const totpInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUrl, setTotpUrl] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { copied: totpSecretCopied, copy: copySecret } = useCopy({ failedMessage: t('copyFailed') });
  const [isPending, startTransition] = useTransition();

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
      setTotp('');
      return setIsDialogOpen(false);
    }
    setTotp('');
    setTotpUrl('');
    setTotpSecret('');
    setIsDialogOpen(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const { data, error } = await authClient.twoFactor.enable({ password });
      if (error || !data) {
        setPassword('');
        toast.error(t('setupFailed'));
        return;
      }
      // data.backupCodes stays hidden: sign-in has no backup code entry yet, so
      // showing them would promise a recovery path that doesn't exist.
      setTotpUrl(data.totpURI);
    });
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const { error } = await authClient.twoFactor.verifyTotp({ code: totp });
      if (error) {
        setTotp('');
        totpInputRef.current?.focus();
        toast.error(t('enableFailed'));
        return;
      }
      await refreshSession();
      setIsDialogOpen(false);
      toast.success(t('enabledSuccess'));
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
        <Button variant='outline' size='sm' disabled={isPending} className='cursor-pointer'>
          {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : t('enable')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className='max-h-[90vh] w-86 overflow-y-auto'>
        {!totpUrl ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('passwordPromptTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('passwordPromptDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handlePasswordSubmit}>
              <div className='mb-4 space-y-2'>
                <Label htmlFor='totp-setup-password'>{t('passwordLabel')}</Label>
                <Input
                  id='totp-setup-password'
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
                  {t('cancel')}
                </AlertDialogCancel>
                <Button type='submit' disabled={isPending || !password} className='cursor-pointer'>
                  {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : t('confirm')}
                </Button>
              </AlertDialogFooter>
            </form>
          </>
        ) : (
          <>
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
                        <button className='ms-2 block cursor-pointer py-0.5' onClick={() => copySecret(totpSecret)}>
                          {totpSecretCopied ? <Check className='size-3' /> : <Clipboard className='size-3' />}
                        </button>
                      </TooltipContent>
                    </Tooltip>
                  ),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form onSubmit={handleCodeSubmit}>
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
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DisableTotp() {
  const t = useTranslations('components.userSettings.security.totp');
  const { refreshSession } = useSessionRefresh();
  const [password, setPassword] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setPassword('');
    }
    setIsDialogOpen(open);
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        setPassword('');
        toast.error(t('disableFailed'));
        return;
      }
      await refreshSession();
      setIsDialogOpen(false);
      setPassword('');
      toast.success(t('disabledSuccess'));
    });
  };

  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center gap-1.5 text-sm text-green-600'>
        <Check className='h-4 w-4' />
        <span className='font-medium'>{t('enabled')}</span>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogTrigger asChild>
          <Button variant='outline' size='sm' disabled={isPending} className='cursor-pointer'>
            {t('disable')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className='w-80'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>{t('disableTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('disableDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={handleOnSubmit}>
            <div className='mb-4 space-y-2'>
              <Label htmlFor='totp-disable-password'>{t('passwordLabel')}</Label>
              <Input
                id='totp-disable-password'
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
                {t('cancel')}
              </AlertDialogCancel>
              <Button
                type='submit'
                disabled={isPending || !password}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer'
              >
                {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : t('disable')}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UserSecurityTotpSettings({ hasPassword }: { hasPassword: boolean | null }) {
  const { data: session } = authClient.useSession();
  const t = useTranslations('components.userSettings.security.totp');

  const action = session?.user.twoFactorEnabled ? (
    <DisableTotp />
  ) : hasPassword === false ? (
    <DisabledTooltip disabled message={t('managedByOAuth')}>
      {(isDisabled) => (
        <Button variant='outline' size='sm' disabled={isDisabled} className='cursor-pointer'>
          {t('enable')}
        </Button>
      )}
    </DisabledTooltip>
  ) : hasPassword ? (
    <SetupTotp />
  ) : (
    <Button variant='outline' size='sm' disabled className='cursor-pointer'>
      {t('enable')}
    </Button>
  );

  return <SettingRow label={t('title')} description={t('description')} action={action} />;
}

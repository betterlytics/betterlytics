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
import { Check, Clipboard, Download, Loader2, TriangleAlert } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { useEffect, useRef, useState, useTransition } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import ExternalLink from '@/components/ExternalLink';
import { useTranslations } from 'next-intl';

function useCopy(failedMessage: string) {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(failedMessage);
    }
  };

  return { copied, copy };
}

function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const t = useTranslations('components.userSettings.security.totp');
  const { copied, copy } = useCopy(t('copyFailed'));

  const download = () => {
    const url = URL.createObjectURL(new Blob([codes.join('\n') + '\n'], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'betterlytics-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{t('backupCodesTitle')}</AlertDialogTitle>
        <AlertDialogDescription>{t('backupCodesDescription')}</AlertDialogDescription>
      </AlertDialogHeader>
      <div className='flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400'>
        <TriangleAlert className='mt-0.5 size-4 shrink-0' />
        <span>{t('backupCodesWarning')}</span>
      </div>
      <ol className='bg-muted/50 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border px-4 py-3 font-mono text-sm tracking-wide whitespace-nowrap'>
        {codes.map((code, index) => (
          <li key={code} className='flex items-baseline gap-2'>
            <span className='text-muted-foreground w-4 shrink-0 text-right text-xs tabular-nums'>{index + 1}</span>
            <span>{code}</span>
          </li>
        ))}
      </ol>
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          className='flex-1 cursor-pointer'
          onClick={() => copy(codes.join('\n'))}
        >
          {copied ? <Check className='size-4' /> : <Clipboard className='size-4' />}
          {copied ? t('copied') : t('copyCodes')}
        </Button>
        <Button variant='outline' size='sm' className='flex-1 cursor-pointer' onClick={download}>
          <Download className='size-4' />
          {t('downloadCodes')}
        </Button>
      </div>
      <AlertDialogFooter>
        <Button onClick={onDone} className='w-full cursor-pointer'>
          {t('backupCodesDone')}
        </Button>
      </AlertDialogFooter>
    </>
  );
}

function SetupTotp({ onEnabled }: { onEnabled: (backupCodes: string[]) => void }) {
  const t = useTranslations('components.userSettings.security.totp');
  const { refreshSession } = useSessionRefresh();
  const totpInputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpUrl, setTotpUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { copied: totpSecretCopied, copy: copySecret } = useCopy(t('copyFailed'));
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
      setTotpUrl(data.totpURI);
      setBackupCodes(data.backupCodes);
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
      // The session refetch unmounts this component, so the parent takes over the codes
      onEnabled(backupCodes);
      await refreshSession();
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
                        <button
                          className='ms-2 block cursor-pointer py-0.5'
                          onClick={() => copySecret(totpSecret)}
                        >
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

function RegenerateBackupCodes() {
  const t = useTranslations('components.userSettings.security.totp');
  const [password, setPassword] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDialogOpenChange = (open: boolean) => {
    setPassword('');
    setCodes([]);
    setIsDialogOpen(open);
  };

  const handleOnSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({ password });
      if (error || !data) {
        setPassword('');
        toast.error(t('regenerateFailed'));
        return;
      }
      setCodes(data.backupCodes);
    });
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant='outline' size='sm' disabled={isPending} className='cursor-pointer'>
          {t('regenerate')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className='max-h-[90vh] w-96 overflow-y-auto'>
        {codes.length > 0 ? (
          <BackupCodes codes={codes} onDone={() => handleDialogOpenChange(false)} />
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('regenerateTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{t('regenerateDescription')}</AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handleOnSubmit}>
              <div className='mb-4 space-y-2'>
                <Label htmlFor='totp-regenerate-password'>{t('passwordLabel')}</Label>
                <Input
                  id='totp-regenerate-password'
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
                  {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : t('regenerate')}
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
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

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
    <SetupTotp onEnabled={setNewBackupCodes} />
  ) : (
    <Button variant='outline' size='sm' disabled className='cursor-pointer'>
      {t('enable')}
    </Button>
  );

  return (
    <>
      <SettingRow label={t('title')} description={t('description')} action={action} />
      {session?.user.twoFactorEnabled && (
        <SettingRow
          label={t('backupCodesTitle')}
          description={t('backupCodesRowDescription')}
          action={<RegenerateBackupCodes />}
        />
      )}
      <AlertDialog open={newBackupCodes.length > 0}>
        <AlertDialogContent className='max-h-[90vh] w-96 overflow-y-auto'>
          <BackupCodes codes={newBackupCodes} onDone={() => setNewBackupCodes([])} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

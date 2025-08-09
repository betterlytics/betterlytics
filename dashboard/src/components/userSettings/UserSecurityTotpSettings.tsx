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
import { useIsMobile } from '@/hooks/use-mobile';
import { Check, Clipboard, KeySquare, Loader2, Trash2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState, useTransition } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';
import ExternalLink from '@/components/ExternalLink';

function SetupTotp() {
  const isMobile = useIsMobile();
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
        <Button className='w-full sm:w-auto' disabled={isPending || isDialogOpen}>
          {isPending || isDialogOpen ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Enable 2FA'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className='max-h-[90vh] w-80 overflow-y-auto'
        onOpenAutoFocus={handleDialogOpenAutoFocus}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Enable 2FA</AlertDialogTitle>
          <AlertDialogDescription>
            To enable 2FA, scan the QR code with your authenticator app
            {!isMobile && (
              <>
                {' or use the '}
                <Tooltip>
                  <TooltipTrigger asChild className='border-b-primary cursor-pointer border-0 border-b-2'>
                    <strong>setup key</strong>
                  </TooltipTrigger>
                  <TooltipContent className='flex flex-row items-center'>
                    <code>{totpSecret}</code>
                    <button className='ms-2 block cursor-pointer py-0.5' onClick={() => handleCopy(totpSecret)}>
                      {totpSecretCopied ? <Check className='size-3' /> : <Clipboard className='size-3' />}
                    </button>
                  </TooltipContent>
                </Tooltip>
                {' to manually configure it'}
              </>
            )}
            , then enter the verification code below.
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
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button type='submit' disabled={isPending || totp.length !== 6}>
              {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Confirm'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DisableTotp() {
  const { update: setSession } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDisableTotp = () => {
    startTransition(async () => {
      const disabled = await disableTotpAction();
      if (disabled.success) {
        await setSession({ totpEnabled: false });
        setIsDialogOpen(false);
        toast.success('Two-factor authentication disabled successfully');
      } else {
        toast.error('Failed to disabled two-factor authentication. Please try again.');
      }
    });
  };

  return (
    <div className='flex space-x-2'>
      <div className='flex items-center gap-1 text-sm text-green-600'>
        <Check className='h-3 w-3' />
        <span>Enabled</span>
      </div>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant='link' disabled={isPending} className='text-muted-foreground cursor-pointer'>
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className='w-80'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>Disable 2FA</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable two-factor authentication for your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableTotp}
              disabled={isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isPending ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function UserSecurityTotpSettings() {
  const { data: session } = useSession();

  return (
    <SettingsCard
      icon={KeySquare}
      title='Two-Factor Authentication'
      description='Add an extra layer of security to your account by requiring a second form of verification in addition to your password'
    >
      {session?.user.totpEnabled ? <DisableTotp /> : <SetupTotp />}
    </SettingsCard>
  );
}

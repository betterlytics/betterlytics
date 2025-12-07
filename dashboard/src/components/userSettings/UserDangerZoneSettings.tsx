'use client';

import { useTransition, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { UserSettingsUpdate } from '@/entities/account/userSettings.entities';
import { deleteUserAccountAction } from '@/app/actions/account/userSettings.action';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import SettingsCard from '@/components/SettingsCard';
import { useTranslations } from 'next-intl';
import { CountdownButton } from '@/components/uiExtensions/CountdownButton';

interface UserDangerZoneSettingsProps {
  formData: UserSettingsUpdate;
  onUpdate: (updates: Partial<UserSettingsUpdate>) => void;
}

export default function UserDangerZoneSettings({ formData, onUpdate }: UserDangerZoneSettingsProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canDelete, setCanDelete] = useState(false);
  const t = useTranslations('components.userSettings.danger');

  useEffect(() => {
    if (isDialogOpen) {
      setCountdown(5);
      setCanDelete(false);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanDelete(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isDialogOpen]);

  const handleDeleteAccount = async () => {
    if (!session?.user?.id) {
      toast.error(t('toast.unable'));
      return;
    }

    startTransition(async () => {
      try {
        await deleteUserAccountAction();
        toast.success(t('toast.success'));
        await signOut({ callbackUrl: '/' });
      } catch (error) {
        console.error('Failed to delete account:', error);
        toast.error(t('toast.error'));
      }
    });
  };

  return (
    <div className='space-y-6'>
      <SettingsCard icon={Trash2} title={t('title')} description={t('description')}>
        <div className='space-y-4'>
          <div className='border-destructive/20 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4'>
            <AlertTriangle className='text-destructive mt-0.5 h-5 w-5 flex-shrink-0' />
            <div className='text-sm'>
              <p className='text-destructive mb-1 font-medium'>{t('warning')}</p>
              <p className='text-muted-foreground'>{t('details')}</p>
            </div>
          </div>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={isPending}
                className='hover:bg-destructive/80 dark:hover:bg-destructive/80 bg-destructive/85 w-full cursor-pointer sm:w-auto'
              >
                {isPending ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='mr-2 h-4 w-4' />
                )}
                {t('delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2'>
                  <AlertTriangle className='text-destructive h-5 w-5' />
                  {t('dialog.title')}
                </AlertDialogTitle>
                <AlertDialogDescription>{t('dialog.description')}</AlertDialogDescription>
              </AlertDialogHeader>

              <div className='text-muted-foreground space-y-2 text-sm'>
                <ul className='list-inside list-disc space-y-1'>
                  <li>{t('dialog.li1')}</li>
                  <li>{t('dialog.li2')}</li>
                  <li>{t('dialog.li3')}</li>
                  <li>{t('dialog.li4')}</li>
                </ul>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending} className='cursor-pointer'>
                  {t('dialog.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <CountdownButton
                    onClick={handleDeleteAccount}
                    isPending={isPending}
                    disabled={isPending || !canDelete}
                  >
                    {canDelete ? t('dialog.confirm') : `${t('dialog.confirm')} (${countdown})`}
                  </CountdownButton>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsCard>
    </div>
  );
}

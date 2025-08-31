'use client';

import { useTransition, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { UserSettingsUpdate } from '@/entities/userSettings';
import { deleteUserAccountAction } from '@/app/actions/userSettings';
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
      toast.error('Unable to delete account. Please try signing in again.');
      return;
    }

    startTransition(async () => {
      try {
        await deleteUserAccountAction();
        toast.success('Account deleted successfully');
        await signOut({ callbackUrl: '/' });
      } catch (error) {
        console.error('Failed to delete account:', error);
        toast.error('Failed to delete account. Please try again.');
      }
    });
  };

  return (
    <div className='space-y-6'>
      <SettingsCard
        icon={Trash2}
        title='Delete Account'
        description='Permanently delete your account and all associated data'
      >
        <div className='space-y-4'>
          <div className='border-destructive/20 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4'>
            <AlertTriangle className='text-destructive mt-0.5 h-5 w-5 flex-shrink-0' />
            <div className='text-sm'>
              <p className='text-destructive mb-1 font-medium'>Warning: This action cannot be undone</p>
              <p className='text-muted-foreground'>
                This will permanently delete your account, remove access to all dashboards, and delete all your
                personal settings.
              </p>
            </div>
          </div>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant='destructive'
                disabled={isPending}
                className='hover:bg-destructive/80 dark:hover:bg-destructive/80 bg-destructive/85 w-full sm:w-auto'
              >
                {isPending ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Trash2 className='mr-2 h-4 w-4' />
                )}
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className='flex items-center gap-2'>
                  <AlertTriangle className='text-destructive h-5 w-5' />
                  Delete Account Permanently
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you absolutely sure you want to delete your account? This action cannot be undone and will
                  permanently:
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className='text-muted-foreground space-y-2 text-sm'>
                <ul className='list-inside list-disc space-y-1'>
                  <li>Delete all your personal information</li>
                  <li>Remove access to all your dashboards</li>
                  <li>Delete all your account settings</li>
                  <li>Sign you out of all devices</li>
                </ul>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant='destructive'
                    onClick={handleDeleteAccount}
                    disabled={isPending || !canDelete}
                    className='hover:bg-destructive/80 dark:hover:bg-destructive/80 bg-destructive/85 w-full sm:w-auto'
                  >
                    {isPending ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='mr-2 h-4 w-4' />
                    )}
                    {canDelete ? 'Delete Account Permanently' : `Delete Account Permanently (${countdown})`}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsCard>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DestructiveActionDialog } from '@/components/dialogs';
import UserSettingsSection from './UserSettingsSection';
import {
  getActiveSessionCountAction,
  signOutOtherSessionsAction,
} from '@/app/actions/account/userSettings.action';

const SESSIONS_QUERY_KEY = ['userSessionCount'] as const;

export default function UserSessionsSettings() {
  const t = useTranslations('components.userSettings.sessions');
  const tDialog = useTranslations('components.userSettings.dialog');
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessionCount, isLoading } = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: async () => {
      const result = await getActiveSessionCountAction();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  const handleSignOutOthers = () => {
    startTransition(async () => {
      const result = await signOutOtherSessionsAction();
      if (result.success) {
        toast.success(t('toast.success', { count: result.data.revoked }));
        queryClient.setQueryData(SESSIONS_QUERY_KEY, 1);
        setIsConfirmOpen(false);
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  const hasOtherSessions = (sessionCount ?? 0) > 1;

  return (
    <UserSettingsSection title={t('title')}>
      <div className='flex items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='text-sm font-medium'>
            {isLoading ? (
              <Skeleton className='h-4 w-32' />
            ) : (
              t('activeCount', { count: sessionCount ?? 0 })
            )}
          </div>
          <p className='text-muted-foreground text-xs'>{t('description')}</p>
        </div>
        <div className='flex-shrink-0'>
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending || isLoading || !hasOtherSessions}
            className='cursor-pointer'
          >
            {t('signOutOthers')}
          </Button>
        </div>
      </div>

      <DestructiveActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={t('dialog.title')}
        description={t('dialog.description')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.confirm')}
        onConfirm={handleSignOutOthers}
        isPending={isPending}
      />
    </UserSettingsSection>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DestructiveActionDialog } from '@/components/dialogs';
import UserSettingsSection from '../shared/UserSettingsSection';
import SettingRow from '../shared/SettingRow';
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
        queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        setIsConfirmOpen(false);
      } else {
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  const hasOtherSessions = (sessionCount ?? 0) > 1;

  return (
    <UserSettingsSection title={t('title')}>
      <SettingRow
        label={
          isLoading ? <Skeleton className='h-4 w-32' /> : t('activeCount', { count: sessionCount ?? 0 })
        }
        description={t('description')}
        action={
          <Button
            variant='destructive'
            size='sm'
            onClick={() => setIsConfirmOpen(true)}
            disabled={isPending || isLoading || !hasOtherSessions}
            className='cursor-pointer'
          >
            {t('signOutOthers')}
          </Button>
        }
      />

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

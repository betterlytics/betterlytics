'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import UserSettingsSection from './UserSettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useSettingMutation } from '@/hooks/use-setting-mutation';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import { updateUserAction } from '@/app/actions/account/userSettings.action';
import { UpdateUserSchema } from '@/entities/auth/user.entities';

export default function UserProfileSettings() {
  const { data: session } = useSession();
  const { refreshSession } = useSessionRefresh();
  const t = useTranslations('components.userSettings.profile');
  const tDialog = useTranslations('components.userSettings.dialog');
  const email = session?.user?.email ?? '';
  const emailVerified = session?.user?.emailVerified;
  const sessionName = session?.user?.name ?? '';

  const [name, setName] = useState(sessionName);

  const nameMutation = useSettingMutation({
    action: async (input: { name: string }) => {
      const payload = UpdateUserSchema.parse({ name: input.name });
      return updateUserAction(payload);
    },
    onSuccess: () => refreshSession(),
    onError: (message) => {
      setName(sessionName);
      toast.error(message || tDialog('toast.error'));
    },
  });

  const handleCommitName = () => {
    const trimmed = name.trim();
    if (trimmed === sessionName.trim() || trimmed === '') {
      return;
    }
    nameMutation.mutate({ name: trimmed });
  };

  return (
    <UserSettingsSection title={t('title')}>
      <div className='space-y-2'>
        <Label htmlFor='name' className='text-sm font-medium'>
          {t('nameLabel')}
        </Label>
        <Input
          id='name'
          type='text'
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleCommitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          placeholder={t('namePlaceholder')}
        />
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <Label htmlFor='email' className='text-sm font-medium'>
            {t('emailLabel')}
          </Label>
          {emailVerified ? (
            <div className='flex items-center gap-1 text-xs text-green-600'>
              <Check className='h-3 w-3' />
              <span>{t('verified')}</span>
            </div>
          ) : (
            <div className='flex items-center gap-1 text-xs text-red-600'>
              <X className='h-3 w-3' />
              <span>{t('unverified')}</span>
            </div>
          )}
        </div>
        <Input id='email' type='email' value={email} disabled readOnly />
      </div>
    </UserSettingsSection>
  );
}

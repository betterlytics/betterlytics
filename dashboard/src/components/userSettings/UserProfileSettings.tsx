'use client';

import { useState } from 'react';
import { Check, User, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import SettingsCard from '@/components/SettingsCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import SettingStatusIndicator from './SettingStatusIndicator';
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
    <div className='space-y-6'>
      <SettingsCard icon={User} title={t('title')} description={t('description')}>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Label htmlFor='name'>{t('nameLabel')}</Label>
              <SettingStatusIndicator status={nameMutation.status} />
            </div>
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
            <p className='text-muted-foreground text-xs'>{t('optional')}</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>
              {t('emailLabel')}
              {emailVerified ? (
                <div className='flex items-center gap-1 text-sm text-green-600'>
                  <Check className='h-3 w-3' />
                  <span>{t('verified')}</span>
                </div>
              ) : (
                <div className='flex items-center gap-1 text-sm text-red-600'>
                  <X className='h-3 w-3' />
                  <span>{t('unverified')}</span>
                </div>
              )}
            </Label>
            <Input id='email' type='email' value={email} disabled readOnly />
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}

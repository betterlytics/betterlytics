'use client';

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import UserSettingsSection from './UserSettingsSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSessionRefresh } from '@/hooks/use-session-refresh';
import {
  getUserOAuthProvidersAction,
  updateUserNameAction,
} from '@/app/actions/account/userSettings.action';
import { UpdateUserNameSchema } from '@/entities/auth/user.entities';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
};

export default function UserProfileSettings() {
  const { data: session } = useSession();
  const { refreshSession } = useSessionRefresh();
  const locale = useLocale();
  const t = useTranslations('components.userSettings.profile');
  const tDialog = useTranslations('components.userSettings.dialog');
  const email = session?.user?.email ?? '';
  const emailVerified = session?.user?.emailVerified;
  const sessionName = session?.user?.name ?? '';
  const createdAt = session?.user?.createdAt;

  const [name, setName] = useState(sessionName);
  const [, startTransition] = useTransition();

  const { data: oauthProviders } = useQuery({
    queryKey: ['userOAuthProviders'],
    queryFn: async () => {
      const result = await getUserOAuthProvidersAction();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
  });

  const handleCommitName = () => {
    const trimmed = name.trim();
    if (trimmed === sessionName.trim() || trimmed === '') {
      return;
    }
    startTransition(async () => {
      const payload = UpdateUserNameSchema.parse({ name: trimmed });
      const result = await updateUserNameAction(payload);
      if (result.success) {
        refreshSession();
      } else {
        setName(sessionName);
        toast.error(result.error.message || tDialog('toast.error'));
      }
    });
  };

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
    : null;

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
          maxLength={64}
          placeholder={t('namePlaceholder')}
        />
      </div>

      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Label htmlFor='email' className='text-sm font-medium'>
              {t('emailLabel')}
            </Label>
            {oauthProviders && oauthProviders.length > 0 && (
              <Badge variant='secondary' className='font-normal'>
                {t('signedInWith', {
                  provider: PROVIDER_LABELS[oauthProviders[0]] ?? oauthProviders[0],
                })}
              </Badge>
            )}
          </div>
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
        {memberSince && (
          <p className='text-muted-foreground text-xs'>{t('memberSince', { date: memberSince })}</p>
        )}
      </div>
    </UserSettingsSection>
  );
}

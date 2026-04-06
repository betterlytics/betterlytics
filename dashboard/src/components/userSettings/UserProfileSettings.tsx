'use client';

import { Check, User, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import SettingsCard from '@/components/SettingsCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import type { UserSettingsUpdate } from '@/entities/account/userSettings.entities';

interface UserProfileSettingsProps {
  formData: UserSettingsUpdate & { name?: string | null };
  onUpdate: (updates: Partial<UserSettingsUpdate & { name?: string | null }>) => void;
}

export default function UserProfileSettings({ formData, onUpdate }: UserProfileSettingsProps) {
  const { data: session } = useSession();
  const t = useTranslations('components.userSettings.profile');
  const email = session?.user?.email ?? '';
  const emailVerified = session?.user?.emailVerified;
  const name = formData.name ?? '';

  return (
    <div className='space-y-6'>
      <SettingsCard icon={User} title={t('title')} description={t('description')}>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>{t('nameLabel')}</Label>
            <Input
              id='name'
              type='text'
              value={name}
              onChange={(e) => onUpdate({ name: e.target.value })}
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

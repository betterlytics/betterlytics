'use client';

import { Check, User, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import SettingsCard from '@/components/SettingsCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserSettingsUpdate } from '@/entities/account/userSettings.entities';
import { useTranslations } from 'next-intl';

interface UserProfileSettingsProps {
  formData: UserSettingsUpdate & {
    name?: string | null;
    email?: string;
  };
  onUpdate: (updates: Partial<UserSettingsUpdate & { name?: string | null; email?: string }>) => void;
}

export default function UserProfileSettings({ formData, onUpdate }: UserProfileSettingsProps) {
  const { data: session } = useSession();
  const [name, setName] = useState(formData.name ?? session?.user?.name ?? '');
  const [email, setEmail] = useState(formData.email ?? session?.user?.email ?? '');
  const [emailVerified] = useState(session?.user?.emailVerified);
  const t = useTranslations('components.userSettings.profile');

  useEffect(() => {
    setName(formData.name ?? session?.user?.name ?? '');
  }, [formData.name, session?.user?.name]);

  useEffect(() => {
    setEmail(formData.email ?? session?.user?.email ?? '');
  }, [formData.email, session?.user?.email]);

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
              onChange={(e) => {
                const nextName = e.target.value;
                setName(nextName);
                onUpdate({ name: nextName.trim() || null });
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

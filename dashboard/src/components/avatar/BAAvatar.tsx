'use client';

import { useUserSettings } from '@/hooks/useUserSettings';
import { useMemo } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { GravatarImage } from '@/components/ui/gravatar-image';
import { useSession } from 'next-auth/react';

export function BAAvatar() {
  const { settings } = useUserSettings();
  const avatarMode = useMemo(() => settings?.avatar, [settings?.avatar]);

  return (
    <Avatar className='relative h-8 w-8'>
      {avatarMode === 'gravatar' ? <GravatarAvatar /> : <DefaultAvatar />}
    </Avatar>
  );
}

function DefaultAvatar() {
  return <User className='bg-muted text-muted-foreground size-full p-2' />;
}

function GravatarAvatar() {
  const { data: session } = useSession();

  if (!session) {
    return <DefaultAvatar />;
  }

  return (
    <>
      <DefaultAvatar />
      <GravatarImage email={session.user.email} alt={session.user.name || 'User'} className='bg-red absolute' />
    </>
  );
}

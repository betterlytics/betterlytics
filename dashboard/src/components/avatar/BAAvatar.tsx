'use client';

import { useUserSettings } from '@/contexts/UserSettingsProvider';
import { Avatar } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { GravatarImage } from '@/components/ui/gravatar-image';
import { authClient } from '@/lib/auth-client';

export function BAAvatar() {
  const settings = useUserSettings();

  return (
    <Avatar className='relative h-8 w-8'>
      {settings.avatar === 'gravatar' ? <GravatarAvatar /> : <DefaultAvatar />}
    </Avatar>
  );
}

function DefaultAvatar() {
  return <User className='bg-muted text-muted-foreground size-full p-2' />;
}

function GravatarAvatar() {
  const { data: session } = authClient.useSession();

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

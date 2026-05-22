'use client';

import { useSession } from 'next-auth/react';
import { useUserSettings } from '@/contexts/UserSettingsProvider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GravatarImage } from '@/components/ui/gravatar-image';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-fuchsia-500',
  'bg-teal-500',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0]) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

function getAvatarColor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
}

export function BAAvatar() {
  const settings = useUserSettings();
  const { data: session } = useSession();

  const name = session?.user?.name;
  const email = session?.user?.email;
  const initials = getInitials(name, email);
  const colorClass = getAvatarColor(email ?? name ?? 'user');
  const showGravatar = settings.avatar === 'gravatar' && Boolean(email);

  return (
    <Avatar className='relative h-8 w-8'>
      {showGravatar && <GravatarImage email={email!} alt={name || 'User'} />}
      <AvatarFallback className={`${colorClass} rounded-none text-xs font-medium text-white`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

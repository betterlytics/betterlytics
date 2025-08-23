'use client';

import React from 'react';
import { Monitor } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';
import { osIconNamesThemed, osLabels, type OSType } from '@/constants/operatingSystemIcons';

interface OSIconProps {
  name: string;
  className?: string;
}

export const OSIcon = React.memo<OSIconProps>(({ name, className = 'h-3.5 w-3.5' }) => {
  const { resolvedTheme } = useTheme();

  const iconName = React.useMemo(() => {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '') as OSType;
    const iconVariants = osIconNamesThemed[normalizedName];

    if (!iconVariants) return null;

    return resolvedTheme === 'dark' ? iconVariants.dark : iconVariants.light;
  }, [name, resolvedTheme]);

  if (!iconName) {
    return <Monitor className={className} />;
  }

  return <Icon icon={iconName} className={className} />;
});

OSIcon.displayName = 'OSIcon';

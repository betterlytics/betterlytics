import React from 'react';
import { Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import { browserIconNames, normalizeBrowserKey } from '@/constants/browserIcons';

interface BrowserIconProps {
  name: string;
  className?: string;
}

export const BrowserIcon = React.memo<BrowserIconProps>(({ name, className = 'h-3.5 w-3.5' }) => {
  const normalizedKey = normalizeBrowserKey(name);
  const iconName = normalizedKey ? browserIconNames[normalizedKey] : undefined;

  if (!iconName) {
    return <Globe className={className} />;
  }

  return <Icon icon={iconName} className={className} />;
});

BrowserIcon.displayName = 'BrowserIcon';

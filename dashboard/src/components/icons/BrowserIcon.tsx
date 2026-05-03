'use client';
import React from 'react';
import { Globe } from 'lucide-react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { resolveBrowser } from '@/constants/browserIcons';

interface BrowserIconProps {
  name: string;
  className?: string;
}

export const BrowserIcon = React.memo<BrowserIconProps>(({ name, className = 'h-3.5 w-3.5' }) => {
  const [iconFailed, setIconFailed] = React.useState(false);

  const def = resolveBrowser(name);

  if (!def) return <Globe className={className} />;

  if (def?.icon && !iconFailed) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center align-[-0.125em]', className)}>
        <Icon
          icon={def.icon}
          className='h-full w-full'
          aria-label={def.label}
          onError={() => setIconFailed(true) as unknown as void}
        />
      </span>
    );
  }

  if (def?.localFile) {
    return <img src={`/browser-icons/${def.localFile}`} alt={def.label} className={className} />;
  }

  return <Globe className={className} />;
});

BrowserIcon.displayName = 'BrowserIcon';

import React from 'react';
import { cn } from '@/lib/utils';

type StaticIconProps = {
  src: string;
  label: string;
  mono?: boolean;
  className?: string;
};

export function StaticIcon({ src, label, mono, className }: StaticIconProps) {
  if (mono) {
    return (
      <span
        role='img'
        aria-label={label}
        className={cn('inline-block shrink-0 bg-current align-[-0.125em]', className)}
        style={{
          maskImage: `url(${src})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
        }}
      />
    );
  }

  return <img src={src} alt={label} className={cn('shrink-0', className)} />;
}

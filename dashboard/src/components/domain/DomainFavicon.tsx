'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFaviconUrl } from '@/lib/favicons';

interface DomainFaviconProps {
  domain?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

export function DomainFavicon({ domain, size = 16, className, alt }: DomainFaviconProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const resolvedAlt = alt ?? (domain ? `${domain} favicon` : 'Domain favicon');
  const source = hasError ? null : getFaviconUrl(domain);

  return (
    <span
      className='relative inline-flex flex-shrink-0 items-center justify-center'
      style={{ width: size, height: size }}
      aria-hidden={domain ? undefined : 'true'}
    >
      <Globe
        style={{ width: size, height: size }}
        className={cn(
          'text-muted-foreground transition-opacity',
          isLoaded && source ? 'opacity-0' : 'opacity-100',
          className,
        )}
        aria-hidden='true'
      />
      {source && (
        <Image
          src={source}
          alt={resolvedAlt}
          unoptimized
          fill
          sizes={`${size}px`}
          className={cn(
            'rounded-sm object-contain transition-opacity',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className,
          )}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </span>
  );
}

'use client';

import { MAP_CARD_CLASS } from '@/components/map/MapCard';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

const ATTRIBUTION_EXPANDED_MS = 3000;

type MapAttributionProps = {
  text: string;
  href: string;
  className?: string;
};

// ODbL wants the credit on the map; it folds to an icon after a few seconds
export default function MapAttribution({ text, href, className }: MapAttributionProps) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(false), ATTRIBUTION_EXPANDED_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      aria-label={text}
      data-expanded={expanded}
      className={cn(
        MAP_CARD_CLASS,
        'group text-muted-foreground hover:text-foreground focus-visible:ring-ring animate-in fade-in flex items-center px-1.5 py-1 text-[10px] leading-none duration-300 outline-none focus-visible:ring-2',
        className,
      )}
    >
      <span
        className={cn(
          'max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-300 group-hover:mr-1 group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:mr-1 group-focus-visible:max-w-48 group-focus-visible:opacity-100',
          expanded && 'mr-1 max-w-48 opacity-100',
        )}
      >
        {text}
      </span>
      <Info className='size-3 shrink-0' aria-hidden />
    </a>
  );
}

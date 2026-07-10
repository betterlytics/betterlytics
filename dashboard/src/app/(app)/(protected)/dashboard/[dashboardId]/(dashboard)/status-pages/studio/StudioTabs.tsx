'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type StudioTab = 'monitors' | 'branding' | 'publish';

type StudioTabsProps = {
  tabs: StudioTab[];
  active: StudioTab;
  onChange: (tab: StudioTab) => void;
  issues: Partial<Record<StudioTab, boolean>>;
};

export function StudioTabs({ tabs, active, onChange, issues }: StudioTabsProps) {
  const t = useTranslations('statusPagesPage.editor.studio');
  const tabRefs = useRef<Partial<Record<StudioTab, HTMLButtonElement | null>>>({});

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = tabs.indexOf(active);
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    const next = tabs[nextIndex];
    onChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div role='tablist' onKeyDown={handleKeyDown} className='bg-muted flex rounded-lg p-1'>
      {tabs.map((tab) => (
        <button
          key={tab}
          ref={(node) => {
            tabRefs.current[tab] = node;
          }}
          type='button'
          role='tab'
          id={`studio-tab-${tab}`}
          aria-controls={`studio-tabpanel-${tab}`}
          aria-selected={tab === active}
          tabIndex={tab === active ? 0 : -1}
          onClick={() => onChange(tab)}
          className={cn(
            'relative flex-1 cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
            tab === active
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`tabs.${tab}`)}
          {issues[tab] && (
            <span
              aria-label={t('tabIssue')}
              title={t('tabIssue')}
              className='bg-destructive absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full'
            />
          )}
        </button>
      ))}
    </div>
  );
}

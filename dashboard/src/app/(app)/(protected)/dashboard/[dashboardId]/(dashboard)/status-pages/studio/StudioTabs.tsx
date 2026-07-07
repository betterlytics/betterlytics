'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type StudioTab = 'monitors' | 'branding' | 'publish';

type StudioTabsProps = {
  tabs: StudioTab[];
  active: StudioTab;
  onChange: (tab: StudioTab) => void;
  /** Tabs with an invalid field get an attention dot, replacing the wizard's per-step gating. */
  issues: Partial<Record<StudioTab, boolean>>;
};

export function StudioTabs({ tabs, active, onChange, issues }: StudioTabsProps) {
  const t = useTranslations('statusPagesPage.editor.studio');

  return (
    <div role='tablist' className='bg-muted flex rounded-lg p-1'>
      {tabs.map((tab) => (
        <button
          key={tab}
          type='button'
          role='tab'
          aria-selected={tab === active}
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

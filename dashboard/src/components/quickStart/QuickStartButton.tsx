'use client';

import { useTranslations } from 'next-intl';
import { useQuickStartOptional } from './QuickStartContext';
import { useSidebar } from '@/components/ui/sidebar';
import { CircularProgress } from '@/components/progress-08';

export function QuickStartButton() {
  const t = useTranslations('components.quickStart');
  const quickStart = useQuickStartOptional();
  const { state: sidebarState } = useSidebar();

  if (!quickStart || !quickStart.progress || quickStart.progress.percentage === 100) {
    return null;
  }

  const { progress, setIsOpen } = quickStart;
  const isCollapsed = sidebarState === 'collapsed';

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className='hover:bg-muted/50 mx-auto flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors'
        title={`${t('title')} - ${progress.completedCount}/${progress.totalCount}`}
      >
        <CircularProgress
          value={progress.percentage}
          size={28}
          strokeWidth={3}
          showLabel
          renderLabel={() => progress.completedCount}
          labelClassName='text-xs font-semibold'
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => setIsOpen(true)}
      className='hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 transition-colors'
    >
      <CircularProgress
        value={progress.percentage}
        size={28}
        strokeWidth={3}
        showLabel
        renderLabel={() => progress.completedCount}
        labelClassName='text-xs font-semibold'
      />
      <span className='text-sm font-medium'>{t('title')}</span>
    </button>
  );
}

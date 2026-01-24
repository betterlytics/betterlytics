'use client';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useQuickStartOptional } from './QuickStartContext';
import { useSidebar } from '@/components/ui/sidebar';

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
      <Button
        onClick={() => setIsOpen(true)}
        variant='secondary'
        size='icon'
        className='border-border relative h-9 w-9 cursor-pointer border shadow-sm'
        title={`${t('title')} - ${progress.percentage}%`}
      >
        <Sparkles className='h-4 w-4' />
        <span className='bg-primary absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full text-[8px] text-white'>
          {progress.completedCount}
        </span>
      </Button>
    );
  }

  return (
    <Button
      onClick={() => setIsOpen(true)}
      variant='secondary'
      className='border-border w-full cursor-pointer justify-between border shadow-sm'
    >
      <span className='flex items-center gap-2'>
        <Sparkles className='h-4 w-4' />
        {t('title')}
      </span>
      <span className='text-muted-foreground text-xs'>
        {progress.completedCount}/{progress.totalCount}
      </span>
    </Button>
  );
}

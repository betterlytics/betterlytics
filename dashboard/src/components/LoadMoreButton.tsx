'use client';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

export type LoadMoreButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
};

export function LoadMoreButton({ onClick, isLoading, hasMore }: LoadMoreButtonProps) {
  const t = useTranslations('components.pagination');

  if (!hasMore) {
    return null;
  }

  return (
    <div className='flex justify-center py-4'>
      <Button variant='outline' onClick={onClick} disabled={isLoading} className='min-w-[140px]'>
        {isLoading ? (
          <>
            <Spinner size='sm' aria-hidden='true' />
            <span>{t('loading')}</span>
          </>
        ) : (
          <span>{t('loadMore')}</span>
        )}
      </Button>
    </div>
  );
}

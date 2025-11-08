import React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface DataEmptyComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

const DataEmptyComponent = React.memo(({ className, style }: DataEmptyComponentProps) => {
  const t = useTranslations('dashboard.emptyStates');
  return (
    <div className={cn('flex h-[300px] items-center justify-center', className)} style={style}>
      <div className='text-center'>
        <p className='text-muted-foreground mb-1'>{t('noData')}</p>
        <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
      </div>
    </div>
  );
});

DataEmptyComponent.displayName = 'DataEmptyComponent';

export default DataEmptyComponent;

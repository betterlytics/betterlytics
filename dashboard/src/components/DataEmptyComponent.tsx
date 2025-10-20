import React from 'react';
import { useTranslations } from 'next-intl';

const DataEmptyComponent = React.memo(() => {
  const t = useTranslations('dashboard.emptyStates');
  return (
    <div className='flex h-[300px] items-center justify-center'>
      <div className='text-center'>
        <p className='text-muted-foreground mb-1'>{t('noData')}</p>
        <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
      </div>
    </div>
  );
});

export default DataEmptyComponent;
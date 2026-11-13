'use client';

import { ZoomOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

export default function ResetZoomButton() {
  const t = useTranslations('components.timeRange');
  const { isZoomed, resetZoom } = useTimeRangeContext();

  if (!isZoomed) return null;

  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={resetZoom}
      className='text-muted-foreground hover:bg-muted hover:text-foreground h-8 cursor-pointer gap-1.5 px-2 text-xs'
    >
      <ZoomOut className='h-4 w-4' />
      {t('resetZoom')}
    </Button>
  );
}

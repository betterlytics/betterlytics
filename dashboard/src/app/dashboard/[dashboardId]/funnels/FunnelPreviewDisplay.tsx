'use client';

import { BAFunnel } from '@/components/funnels/BAFunnel';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { useTranslations } from 'next-intl';

type FunnelPreviewDisplayProps = {
  funnelDetails?: PresentedFunnel;
  funnelName: string;
  isLoading: boolean;
};

export function FunnelPreviewDisplay({ funnelDetails, funnelName, isLoading }: FunnelPreviewDisplayProps) {
  const t = useTranslations('components.funnels.preview');
  if (isLoading) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
        <div className='border-border border-t-primary mb-2 h-8 w-8 animate-spin rounded-full border-4'></div>
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (!funnelDetails || funnelDetails.steps.length < 2 || funnelName.length === 0) {
    return (
      <div className='text-muted-foreground flex h-full items-center justify-center'>
        <p>{t('defineAtLeastTwoSteps')}</p>
      </div>
    );
  }

  return (
    <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-card-foreground h-full overflow-y-auto p-4 text-sm'>
      <BAFunnel funnel={funnelDetails} />
    </div>
  );
}

'use client';

import { type FunnelPreview } from '@/entities/funnels';
import { BAFunnel } from '@/components/funnels/Funnel';

type FunnelPreviewDisplayProps = {
  funnelDetails?: FunnelPreview;
  funnelName: string;
  isLoading: boolean;
};

export function FunnelPreviewDisplay({ funnelDetails, funnelName, isLoading }: FunnelPreviewDisplayProps) {
  if (isLoading) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center'>
        <div className='border-border border-t-primary mb-2 h-8 w-8 animate-spin rounded-full border-4'></div>
        <p>Loading preview...</p>
      </div>
    );
  }

  if (!funnelDetails || funnelDetails.queryFilters.length < 2 || funnelName.length === 0) {
    return (
      <div className='text-muted-foreground flex h-full items-center justify-center'>
        <p>Define at least 2 steps to see the preview.</p>
      </div>
    );
  }

  return (
    <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-card-foreground h-full overflow-y-auto p-4 text-sm'>
      <BAFunnel funnel={funnelDetails} />
    </div>
  );
}

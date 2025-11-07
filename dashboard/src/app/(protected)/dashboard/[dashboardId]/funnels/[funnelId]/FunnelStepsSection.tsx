'use client';

import { use } from 'react';
import { fetchFunnelDetailsAction } from '@/app/actions';
import { BAFunnel } from '@/components/funnels/BAFunnel';

type FunnelStepsSectionProps = {
  funnelPromise: ReturnType<typeof fetchFunnelDetailsAction>;
};

export default function FunnelStepsSection({ funnelPromise }: FunnelStepsSectionProps) {
  const funnel = use(funnelPromise);

  return <BAFunnel funnel={funnel} />;
}

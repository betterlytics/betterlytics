'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import BAPieChart from '@/components/BAPieChart';
import { fetchOutboundLinksDistributionAction } from '@/app/actions/analytics/outboundLinks.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createColorGetter } from '@/utils/colorUtils';

type OutboundLinksPieChartProps = {
  distributionPromise: ReturnType<typeof fetchOutboundLinksDistributionAction>;
};

const getOutboundLinkColor = createColorGetter({
  colorMap: {
    Others: '#64748b',
  },
  saturation: 70,
  lightness: 50,
  useGoldenRatio: false,
});

const formatUrl = (url: string): string => {
  return url === 'Others' ? url : url.toLowerCase();
};

export default function OutboundLinksPieChart({ distributionPromise }: OutboundLinksPieChartProps) {
  const distributionData = use(distributionPromise);
  const t = useTranslations('components.outboundLinks.pieChart');

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center px-0'>
        <BAPieChart data={distributionData} getColor={getOutboundLinkColor} getLabel={formatUrl} />
      </CardContent>
    </Card>
  );
}

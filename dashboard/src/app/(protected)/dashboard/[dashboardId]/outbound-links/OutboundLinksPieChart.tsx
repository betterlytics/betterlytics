'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import BAPieChart from '@/components/BAPieChart';
import { fetchOutboundLinksDistributionAction } from '@/app/actions/analytics/outboundLinks.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

type OutboundLinksPieChartProps = {
  distributionPromise: ReturnType<typeof fetchOutboundLinksDistributionAction>;
};

const getOutboundLinkColor = (name: string): string => {
  const colors: Record<string, string> = {
    Others: '#64748b',
  };

  if (colors[name]) {
    return colors[name];
  }

  // Generate a color based on the string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

const formatUrl = (url: string): string => {
  return url === 'Others' ? url : url.toLowerCase();
};

export default function OutboundLinksPieChart({ distributionPromise }: OutboundLinksPieChartProps) {
  const distributionData = use(distributionPromise);
  const t = useTranslations('components.outboundLinks.pieChart');

  return (
    <Card variant='section' minHeight='chart'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center px-0'>
        <BAPieChart data={distributionData} getColor={getOutboundLinkColor} getLabel={formatUrl} />
      </CardContent>
    </Card>
  );
}

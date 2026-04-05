'use client';

import { useTranslations } from 'next-intl';
import BAPieChart from '@/components/BAPieChart';
import { fetchOutboundLinksDistributionAction } from '@/app/actions/analytics/outboundLinks.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createColorGetter } from '@/utils/colorUtils';
import { formatString } from '@/utils/formatters';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { ChartSkeleton } from '@/components/skeleton';

const getOutboundLinkColor = createColorGetter({
  colorMap: {
    Others: '#64748b',
  },
  saturation: 70,
  lightness: 50,
  useGoldenRatio: false,
});

const formatUrl = (url: string): string => {
  return url === 'Others' ? url : formatString(url.toLowerCase(), 30);
};

export default function OutboundLinksPieChart() {
  const query = useBAQuery({
    queryKey: ['outbound-links-distribution'],
    queryFn: (dashboardId, query) => fetchOutboundLinksDistributionAction(dashboardId, query),
  });
  const t = useTranslations('components.outboundLinks.pieChart');

  return (
    <QuerySection query={query} fallback={<ChartSkeleton />}>
      {(distributionData) => (
        <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-1 items-center justify-center px-0'>
            <BAPieChart data={distributionData} getColor={getOutboundLinkColor} getLabel={formatUrl} />
          </CardContent>
        </Card>
      )}
    </QuerySection>
  );
}

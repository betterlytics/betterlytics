'use client';

import { use } from 'react';
import CampaignLandingPagePerformanceTable from '@/app/(protected)/dashboard/[dashboardId]/campaign/CampaignLandingPagePerformanceTable';
import { fetchCampaignLandingPagePerformanceAction } from '@/app/actions/index.action';

type CampaignLandingPagesSectionProps = {
  landingPagePerformancePromise: ReturnType<typeof fetchCampaignLandingPagePerformanceAction>;
};

export default function CampaignLandingPagesSection({
  landingPagePerformancePromise,
}: CampaignLandingPagesSectionProps) {
  const landingPagePerformance = use(landingPagePerformancePromise);

  return (
    <div>
      <CampaignLandingPagePerformanceTable data={landingPagePerformance} />
    </div>
  );
}

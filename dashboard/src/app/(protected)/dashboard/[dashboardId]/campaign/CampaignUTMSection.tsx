'use client';

import UTMBreakdownTabbedTable from './UTMBreakdownTabbedTable';
import UTMBreakdownTabbedChart from './UTMBreakdownTabbedChart';
import {
  fetchCampaignSourceBreakdownAction,
  fetchCampaignMediumBreakdownAction,
  fetchCampaignContentBreakdownAction,
  fetchCampaignTermBreakdownAction,
} from '@/app/actions';

type CampaignUTMSectionProps = {
  sourceBreakdownPromise: ReturnType<typeof fetchCampaignSourceBreakdownAction>;
  mediumBreakdownPromise: ReturnType<typeof fetchCampaignMediumBreakdownAction>;
  contentBreakdownPromise: ReturnType<typeof fetchCampaignContentBreakdownAction>;
  termBreakdownPromise: ReturnType<typeof fetchCampaignTermBreakdownAction>;
};

export default function CampaignUTMSection({
  sourceBreakdownPromise,
  mediumBreakdownPromise,
  contentBreakdownPromise,
  termBreakdownPromise,
}: CampaignUTMSectionProps) {
  return (
    <div className='grid grid-cols-1 gap-3 lg:grid-cols-3'>
      <div className='lg:col-span-2'>
        <UTMBreakdownTabbedTable
          sourceBreakdownPromise={sourceBreakdownPromise}
          mediumBreakdownPromise={mediumBreakdownPromise}
          contentBreakdownPromise={contentBreakdownPromise}
          termBreakdownPromise={termBreakdownPromise}
        />
      </div>

      <div className='lg:col-span-1'>
        <UTMBreakdownTabbedChart
          sourceBreakdownPromise={sourceBreakdownPromise}
          mediumBreakdownPromise={mediumBreakdownPromise}
          contentBreakdownPromise={contentBreakdownPromise}
          termBreakdownPromise={termBreakdownPromise}
        />
      </div>
    </div>
  );
}

'use client';

import TimeRangeSelector from '@/components/TimeRangeSelector';
import QueryFiltersSelector from '@/components/filters/QueryFiltersSelector';
import { ActiveQueryFilters } from '../filters/ActiveQueryFilters';

export default function DashboardFilters() {
  return (
    <div className='space-y-2'>
      <div className='flex flex-col-reverse justify-end gap-x-4 gap-y-1 md:flex-row'>
        <QueryFiltersSelector />
        <TimeRangeSelector />
      </div>
      <ActiveQueryFilters />
    </div>
  );
}

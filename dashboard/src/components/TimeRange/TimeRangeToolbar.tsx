'use client';

import { PrimaryRangePicker } from './PrimaryRangePicker';
import { CompareRangePicker } from './CompareRangePicker';

export function TimeRangeToolbar({ showComparison = true }: { showComparison?: boolean }) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <PrimaryRangePicker />
      {showComparison && <CompareRangePicker />}
    </div>
  );
}

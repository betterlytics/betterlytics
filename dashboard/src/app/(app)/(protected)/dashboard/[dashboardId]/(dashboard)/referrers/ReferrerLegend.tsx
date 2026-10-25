'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { formatPercentage } from '@/utils/formatters';
import { useReferrerCategoryLabel } from '@/hooks/use-referrer-category-label';

interface ReferrerLegendProps {
  payload?: any[];
  showPercentage?: boolean;
}

// Common legend component that can be used by all referrer charts
export default function ReferrerLegend({ payload, showPercentage = false }: ReferrerLegendProps) {
  const locale = useLocale();
  const categoryLabel = useReferrerCategoryLabel();
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <ul className='text-foreground mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs'>
      {payload.map((entry: any, index: number) => {
        let displayValue: string;

        // For pie chart entries, we display percentages of the total as well
        if (showPercentage) {
          const sourceName = categoryLabel(entry.payload?.name || '');
          displayValue = `${sourceName}: ${formatPercentage(entry.payload?.value, locale)}`;
        } else {
          displayValue = categoryLabel(String(entry.dataKey ?? entry.value));
        }

        return (
          <li key={`item-${index}`} className='flex items-center'>
            <span className='mr-2 h-3 w-3 rounded-full' style={{ backgroundColor: entry.color }} />
            <span>{displayValue}</span>
          </li>
        );
      })}
    </ul>
  );
}

'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { capitalizeFirstLetter, formatPercentage } from '@/utils/formatters';

interface ReferrerLegendProps {
  payload?: any[];
  showPercentage?: boolean;
}

// Common legend component that can be used by all referrer charts
export default function ReferrerLegend({ payload, showPercentage = false }: ReferrerLegendProps) {
  const locale = useLocale();
  if (!payload || payload.length === 0) {
    return null;
  }
  
  return (
    <ul className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mt-4 text-xs text-foreground">
      {payload.map((entry: any, index: number) => {

        let displayValue: string;
        
        // For pie chart entries, we display percentages of the total as well
        if (showPercentage) {
          const sourceName = capitalizeFirstLetter(entry.payload?.name || '');
          displayValue = `${sourceName}: ${formatPercentage(entry.payload?.value, locale)}`;
        } else {
          displayValue = capitalizeFirstLetter(entry.value);
        }
          
        return (
          <li key={`item-${index}`} className="flex items-center">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.color }}
            />
            <span>{displayValue}</span>
          </li>
        );
      })}
    </ul>
  );
} 
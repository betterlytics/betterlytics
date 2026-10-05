'use client';

import React, { useCallback, useState } from 'react';
import { PropertyValueBar } from '@/components/PropertyValueBar';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FilterColumn } from '@/entities/analytics/filter.entities';

export type ProgressBarRowFilter = { column: FilterColumn; value?: string };

export interface ProgressBarData {
  label: string;
  value: number;
  key?: string;
  trendPercentage?: number;
  comparisonValue?: number;
  icon?: React.ReactElement;
  filters?: ProgressBarRowFilter[];
  tooltipLabel?: string; // overrides label in the "Filter by" tooltip
  children?: ProgressBarData[];
}

type ProgressBarListProps<T extends ProgressBarData> = {
  data: T[];
  onItemClick?: (item: T) => void;
  isItemInteractive?: (item: T) => boolean;
  expandedKeys?: Set<string>;
  onToggleExpand?: (key: string) => void;
};

function toggleKey(prev: Set<string>, key: string) {
  const next = new Set(prev);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}

export function ProgressBarList<T extends ProgressBarData>({
  data,
  onItemClick,
  isItemInteractive,
  expandedKeys,
  onToggleExpand,
}: ProgressBarListProps<T>) {
  const [ownExpandedKeys, setOwnExpandedKeys] = useState<Set<string>>(new Set());
  const toggleOwn = useCallback((key: string) => setOwnExpandedKeys((prev) => toggleKey(prev, key)), []);
  const expanded = expandedKeys ?? ownExpandedKeys;
  const toggleExpand = onToggleExpand ?? toggleOwn;
  const tFilters = useTranslations('components.filters');

  const renderList = (items: T[], level: number): React.ReactElement => {
    if (items.length === 0) {
      return <DataEmptyComponent />;
    }

    const maxVisitors = Math.max(...items.map((d) => d.value), 1);
    const total = items.reduce((sum, d) => sum + d.value, 0) || 1;
    const hasComparison = items.some((d) => d.comparisonValue);

    return (
      <div className='space-y-2'>
        {items.map((item, index) => {
          const { key, label, tooltipLabel, value, children = [], trendPercentage, comparisonValue, icon } = item;
          const itemKey = key ?? label;
          const isExpandable = children.length > 0;
          const isExpanded = expanded.has(itemKey);

          const relativePercentage = (value / maxVisitors) * 100;
          const percentage = (value / total) * 100;
          const interactive = isItemInteractive ? isItemInteractive(item) : !!onItemClick;

          return (
            <div
              key={itemKey}
              style={{ paddingLeft: level ? level * 8 : undefined }}
              className={`group relative ${interactive ? 'cursor-pointer' : ''}`}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              title={
                interactive && typeof label === 'string'
                  ? tFilters('filterBy', { label: tooltipLabel ?? label })
                  : undefined
              }
              onClick={interactive ? () => onItemClick?.(item) : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onItemClick?.(item);
                    }
                  : undefined
              }
            >
              <PropertyValueBar
                value={{
                  value: label,
                  count: value,
                  relativePercentage: Math.max(relativePercentage, 2),
                  percentage,
                  trendPercentage,
                  comparisonValue,
                }}
                respectComparison={hasComparison}
                icon={icon}
                leading={
                  isExpandable && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(itemKey);
                      }}
                      aria-expanded={isExpanded}
                      className='group/button h-6 w-6 cursor-pointer rounded-sm !bg-transparent p-0'
                    >
                      {isExpanded ? (
                        <ChevronDown className='text-muted-foreground group-hover/button:text-foreground h-4 w-4 transition-colors duration-150' />
                      ) : (
                        <ChevronRight className='text-muted-foreground group-hover/button:text-foreground h-4 w-4 transition-colors duration-150' />
                      )}
                    </Button>
                  )
                }
                index={index + 1}
              />

              {isExpandable && isExpanded && (
                <div className='mt-2 ml-4 border-l' onClick={(e) => e.stopPropagation()}>
                  {renderList(children as T[], level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return renderList(data, 0);
}

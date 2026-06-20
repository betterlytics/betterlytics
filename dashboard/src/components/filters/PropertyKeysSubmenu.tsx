'use client';

import {
  BADropdownMenuActiveIndicator,
  BADropdownMenuEmpty,
  BADropdownMenuItem,
  BADropdownMenuSkeletonItem,
  BADropdownMenuSub,
  BADropdownMenuSubContent,
  BADropdownMenuSubTrigger,
} from '@/components/ba-dropdown-menu';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { PROPERTY_SOURCES, type PropertySourceKind } from '@/entities/analytics/propertySources';
import { Dispatch, type ReactNode } from 'react';

type PropertyKeysSubmenuProps<TEntity> = {
  source: PropertySourceKind;
  label: string;
  icon: ReactNode;
  emptyLabel: string;
  keys: string[] | undefined;
  filter: QueryFilter & TEntity;
  onFilterUpdate: Dispatch<QueryFilter & TEntity>;
};

export function PropertyKeysSubmenu<TEntity>({
  source,
  label,
  icon,
  emptyLabel,
  keys,
  filter,
  onFilterUpdate,
}: PropertyKeysSubmenuProps<TEntity>) {
  const strategy = getFilterStrategy(filter.column);
  const activeKey = strategy.type === 'json_property' && strategy.source === source ? strategy.key : undefined;

  return (
    <BADropdownMenuSub>
      <BADropdownMenuSubTrigger active={activeKey !== undefined}>
        {icon}
        {label}
      </BADropdownMenuSubTrigger>
      <BADropdownMenuSubContent scrollClassName='max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))]'>
        {keys === undefined ? (
          Array.from({ length: 3 }).map((_, i) => <BADropdownMenuSkeletonItem key={i} />)
        ) : keys.length > 0 ? (
          keys.map((key) => (
            <BADropdownMenuItem
              key={key}
              active={key === activeKey}
              onSelect={() => {
                const next = `${PROPERTY_SOURCES[source].prefix}${key}`;
                if (filter.column === next) return;
                onFilterUpdate({ ...filter, column: next, values: [] });
              }}
            >
              <span className='truncate'>{key}</span>
              <BADropdownMenuActiveIndicator />
            </BADropdownMenuItem>
          ))
        ) : (
          <BADropdownMenuEmpty>{emptyLabel}</BADropdownMenuEmpty>
        )}
      </BADropdownMenuSubContent>
    </BADropdownMenuSub>
  );
}

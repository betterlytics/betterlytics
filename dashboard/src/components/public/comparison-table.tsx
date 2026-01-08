'use client';

import { Fragment } from 'react';
import { Check, X, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeatureValue = boolean | string;

interface ComparisonFeature {
  name: string;
  values: FeatureValue[];
}

interface ComparisonCategory {
  name: string;
  features: ComparisonFeature[];
}

interface ColumnHeader {
  label: string;
  highlight?: boolean;
  logo?: React.ReactNode;
}

interface ComparisonTableProps {
  categories: ComparisonCategory[];
  columns: ColumnHeader[];
  featureColumnLabel?: string;
  disclaimer?: string;
}

const PARTIAL_VALUES = ['partial', 'limited'] as const;

const ICON_STYLES: Record<'true' | 'false' | 'partial', { Icon: LucideIcon; bg: string; text: string }> = {
  true: { Icon: Check, bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' },
  false: { Icon: X, bg: 'bg-gray-500/10', text: 'text-muted-foreground/50' },
  partial: { Icon: Minus, bg: 'bg-amber-500/25', text: 'text-amber-700 dark:text-amber-400' },
};

function FeatureValueCell({ value, highlight }: { value: FeatureValue; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    const iconKey = value ? 'true' : 'false';
    const { Icon, bg, text } = ICON_STYLES[iconKey];
    return (
      <div className='flex justify-center'>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', bg)}>
          <Icon className={cn('h-4 w-4', text)} strokeWidth={value ? 2.5 : 2} />
        </div>
      </div>
    );
  }

  const normalizedValue = value.toLowerCase();
  if (PARTIAL_VALUES.includes(normalizedValue as (typeof PARTIAL_VALUES)[number])) {
    const { Icon, bg, text } = ICON_STYLES.partial;
    return (
      <div className='flex justify-center'>
        <div className={cn('flex h-6 w-6 items-center justify-center rounded-full', bg)}>
          <Icon className={cn('h-4 w-4', text)} strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn('text-sm font-medium', highlight ? 'text-blue-600 dark:text-blue-400' : 'text-foreground/80')}
    >
      {value}
    </span>
  );
}

export function ComparisonTable({
  categories,
  columns,
  featureColumnLabel = 'Feature',
  disclaimer,
}: ComparisonTableProps) {
  return (
    <div className='space-y-2'>
      <div className='border-border/50 bg-card/30 overflow-hidden rounded-xl border backdrop-blur-sm'>
        {/* Desktop */}
        <table className='hidden w-full md:table'>
          <thead>
            <tr className='border-border/50 bg-muted/30 border-b'>
              <th className='px-6 py-4 text-left'>
                <span className='text-muted-foreground text-sm font-medium'>{featureColumnLabel}</span>
              </th>
              {columns.map((column, idx) => (
                <th key={idx} className='px-6 py-4 text-center'>
                  <div className='flex items-center justify-center gap-2'>
                    {column.logo}
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        column.highlight && 'text-blue-600 dark:text-blue-400',
                      )}
                    >
                      {column.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category, catIdx) => (
              <Fragment key={catIdx}>
                <tr className='border-border/50 bg-muted/20 border-t'>
                  <td colSpan={columns.length + 1} className='px-6 py-3'>
                    <span className='text-foreground text-sm font-semibold'>{category.name}</span>
                  </td>
                </tr>
                {category.features.map((feature, featureIdx) => (
                  <tr
                    key={`${catIdx}-${featureIdx}`}
                    className={cn(
                      'hover:bg-muted/20 transition-colors',
                      featureIdx !== category.features.length - 1 && 'border-border/30 border-b',
                    )}
                  >
                    <td className='px-6 py-3.5'>
                      <span className='text-foreground/80 text-sm'>{feature.name}</span>
                    </td>
                    {feature.values.map((value, valueIdx) => (
                      <td key={valueIdx} className='px-6 py-3.5 text-center'>
                        <FeatureValueCell value={value} highlight={columns[valueIdx]?.highlight} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Mobile */}
        <div className='md:hidden'>
          <div
            className='border-border/50 bg-muted/30 grid gap-2 border-b px-4 py-3'
            style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
          >
            {columns.map((column, idx) => (
              <div key={idx} className='flex flex-col items-center justify-center gap-1 text-center'>
                {column.logo}
                <span
                  className={cn('text-xs font-semibold', column.highlight && 'text-blue-600 dark:text-blue-400')}
                >
                  {column.label}
                </span>
              </div>
            ))}
          </div>

          {categories.map((category, catIdx) => (
            <div key={catIdx} className='border-border/50 border-b last:border-b-0'>
              <div className='bg-muted/30 px-4 py-3'>
                <h3 className='text-foreground text-sm font-semibold'>{category.name}</h3>
              </div>
              <div className='divide-border/30 divide-y'>
                {category.features.map((feature, featureIdx) => (
                  <div key={featureIdx} className='px-4 py-3'>
                    <div className='text-foreground/80 mb-2 text-sm font-medium'>{feature.name}</div>
                    <div
                      className='grid gap-2 text-center'
                      style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
                    >
                      {feature.values.map((value, valueIdx) => (
                        <FeatureValueCell key={valueIdx} value={value} highlight={columns[valueIdx]?.highlight} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {disclaimer && <p className='text-muted-foreground/70 text-right text-xs italic'>{disclaimer}</p>}
    </div>
  );
}

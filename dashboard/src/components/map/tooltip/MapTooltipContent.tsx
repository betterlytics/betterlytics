import { MapFeatureTitle } from '@/components/map/tooltip/MapFeatureTitle';
import { TrendPercentage } from '@/components/TrendPercentage';
import { SupportedLanguages } from '@/constants/i18n';
import type { GeoFeatureVisitorWithCompare } from '@/entities/analytics/geography.entities';
import type { GeoFeatureDisplay } from '@/components/map/types';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';
import { calculatePercentageChange } from '@/utils/percentageChange';
import React from 'react';

export type MapTooltipContentProps = {
  geoVisitor?: GeoFeatureVisitorWithCompare;
  className?: string;
  label: string;
  locale: SupportedLanguages;
  size: 'sm' | 'lg';
  display: GeoFeatureDisplay;
  onMouseEnter?: () => void;
};

function MapTooltipContent({
  geoVisitor,
  size,
  className,
  label,
  locale,
  display,
  onMouseEnter,
}: MapTooltipContentProps) {
  if (!geoVisitor) return null;

  const percentageChange = calculatePercentageChange(geoVisitor.visitors, geoVisitor.compareVisitors);

  return (
    <div
      onMouseEnter={onMouseEnter}
      className={cn(
        'text-foreground justify-center space-y-1 p-2 text-start',
        size === 'sm' ? 'max-w-[250px]' : 'max-w-[40vw]',
        className,
      )}
    >
      <MapFeatureTitle display={display} />
      <div className='flex flex-col justify-start text-sm whitespace-nowrap'>
        <div className='flex gap-2 text-sm whitespace-nowrap'>
          <span className='text-muted-foreground'>{label}:</span>
          <div className='text-foreground flex flex-row gap-1'>
            <span>{formatNumber(geoVisitor.visitors, locale)}</span>
            {percentageChange !== undefined && (
              <TrendPercentage percentage={percentageChange} withParenthesis withIcon locale={locale} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MemoizedMapTooltipContent = React.memo(MapTooltipContent);
MemoizedMapTooltipContent.displayName = 'MapTooltipContent';

export default MemoizedMapTooltipContent;

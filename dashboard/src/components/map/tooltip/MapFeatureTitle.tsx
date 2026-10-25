import type { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import type { GeoFeatureDisplay } from '@/components/map/types';
import { cn } from '@/lib/utils';

type MapFeatureTitleProps = {
  display: GeoFeatureDisplay;
  className?: string;
};

export function MapFeatureTitle({ display, className }: MapFeatureTitleProps) {
  return (
    <CountryDisplay
      className={cn('text-sm font-bold', className)}
      countryCode={display.countryCode as FlagIconProps['countryCode']}
      countryName={display.name}
    />
  );
}

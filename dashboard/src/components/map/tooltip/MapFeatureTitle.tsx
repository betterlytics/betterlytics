import { FlagIconProps } from '@/components/icons';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { cn } from '@/lib/utils';

type MapFeatureTitleProps = {
  displayName?: string;
  displayCountryCode?: string;
  className?: string;
};

export function MapFeatureTitle({ displayName, displayCountryCode, className }: MapFeatureTitleProps) {
  if (!displayCountryCode) {
    return <span className={cn('text-sm font-bold', className)}>{displayName}</span>;
  }
  return (
    <CountryDisplay
      className={cn('text-sm font-bold', className)}
      countryCode={displayCountryCode as FlagIconProps['countryCode']}
      countryName={displayName ?? ''}
    />
  );
}

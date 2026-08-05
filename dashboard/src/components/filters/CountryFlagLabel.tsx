import { useLocale } from 'next-intl';
import { hasFlag } from 'country-flag-icons';
import { FlagIcon, type FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';

type CountryFlagLabelProps = {
  countryCode: string;
  className?: string;
  children: React.ReactNode;
};

export function CountryFlagLabel({ countryCode, className, children }: CountryFlagLabelProps) {
  const locale = useLocale();
  const code = countryCode.toUpperCase();

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {hasFlag(code) && (
        <FlagIcon countryCode={code as FlagIconProps['countryCode']} countryName={getCountryName(countryCode, locale)} />
      )}
      {children}
    </span>
  );
}

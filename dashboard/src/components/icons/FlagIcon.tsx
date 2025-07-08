import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { getCountryName } from '@/utils/countryCodes';

export type FlagIconProps = {
  countryCode: keyof typeof Flags;
  countryName?: string; // Defaults to result of getCountryName
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

export const FlagIcon = React.memo(({
  countryCode,
  countryName = getCountryName(countryCode),
  ...props
}: FlagIconProps) => {
  const FlagComponent = Flags[countryCode];

  return (
    <span title={countryName} style={{ display: 'inline-block' }}>
      <FlagComponent {...props} />
    </span>
  );
});

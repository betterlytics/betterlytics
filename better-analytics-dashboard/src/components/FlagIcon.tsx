import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

type FlagIconProps = {
  countryCode: keyof typeof Flags;
} & Flags.ElementAttributes<Flags.HTMLSVGElement>;

function FlagIconComponent({ countryCode, ...props }: FlagIconProps) {
  const FlagComponent = Flags[countryCode];
  return <FlagComponent {...props} />;
}

export const FlagIcon = React.memo(FlagIconComponent);
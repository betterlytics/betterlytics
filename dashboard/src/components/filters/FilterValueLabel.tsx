'use client';

import { type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { hasFlag } from 'country-flag-icons';
import { BrowserIcon, DeviceIcon, FlagIcon, OSIcon, type FlagIconProps } from '@/components/icons';
import { resolveBrowser } from '@/constants/browserIcons';
import { resolveDeviceIcon } from '@/constants/deviceIcons';
import { resolveOSIcon } from '@/constants/operatingSystemIcons';
import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';

const ICON_SIZE = 'size-[1.1em]';
const FLAG_SIZE = 'h-[1.1em] w-[1.65em]';

type FilterValueIconProps = {
  column: FilterColumn;
  value: string;
  // Renders an empty box of the icon's footprint instead, for copies that only need the width.
  placeholder?: boolean;
};

export function FilterValueIcon({ column, value, placeholder = false }: FilterValueIconProps) {
  const locale = useLocale();

  switch (column) {
    case 'country_code': {
      const code = value.toUpperCase();
      if (!hasFlag(code)) return null;
      if (placeholder) return <span className={cn('inline-block', FLAG_SIZE)} />;
      return (
        <FlagIcon countryCode={code as FlagIconProps['countryCode']} countryName={getCountryName(value, locale)} />
      );
    }
    case 'browser':
      if (!resolveBrowser(value)) return null;
      return placeholder ? <IconPlaceholder /> : <BrowserIcon name={value} className={ICON_SIZE} />;
    case 'os':
      if (!resolveOSIcon(value)) return null;
      return placeholder ? <IconPlaceholder /> : <OSIcon name={value} className={ICON_SIZE} />;
    case 'device_type':
      if (!resolveDeviceIcon(value)) return null;
      return placeholder ? <IconPlaceholder /> : <DeviceIcon type={value} className={ICON_SIZE} />;
    default:
      return null;
  }
}

const IconPlaceholder = () => <span className={cn('inline-block', ICON_SIZE)} />;

type FilterValueLabelProps = {
  column: FilterColumn;
  value: string;
  className?: string;
  children: ReactNode;
};

export function FilterValueLabel({ column, value, className, children }: FilterValueLabelProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <FilterValueIcon column={column} value={value} />
      {children}
    </span>
  );
}

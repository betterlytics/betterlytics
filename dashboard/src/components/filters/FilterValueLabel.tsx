'use client';

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

function FilterValueIcon({ column, value }: { column: FilterColumn; value: string }) {
  const locale = useLocale();

  switch (column) {
    case 'country_code': {
      const code = value.toUpperCase();
      if (!hasFlag(code)) return null;
      return (
        <FlagIcon countryCode={code as FlagIconProps['countryCode']} countryName={getCountryName(value, locale)} />
      );
    }
    case 'browser':
      return resolveBrowser(value) ? <BrowserIcon name={value} className={ICON_SIZE} /> : null;
    case 'os':
      return resolveOSIcon(value) ? <OSIcon name={value} className={ICON_SIZE} /> : null;
    case 'device_type':
      return resolveDeviceIcon(value) ? <DeviceIcon type={value} className={ICON_SIZE} /> : null;
    default:
      return null;
  }
}

type FilterValueLabelProps = {
  column: FilterColumn;
  value: string;
  className?: string;
  children: React.ReactNode;
};

export function FilterValueLabel({ column, value, className, children }: FilterValueLabelProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <FilterValueIcon column={column} value={value} />
      {children}
    </span>
  );
}

'use client';

import React, { useMemo, useState, MouseEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { capitalizeFirstLetter } from '@/utils/formatters';

export type MapType = 'accumulated' | 'timeseries';

export type MapTypeNavigationButtonProps = {
  defaultMapType?: MapType;
} & React.ComponentProps<'button'>;

export default function MapTypeNavigationButton(props: MapTypeNavigationButtonProps) {
  const { defaultMapType, onClick, ...buttonProps } = props;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('components.geography.mapType');

  // Derive the current map type from the URL; fall back to prop; then to 'timeseries'
  const derivedMapType: MapType = useMemo(() => {
    if (pathname?.includes('/accumulated')) return 'accumulated';
    if (pathname?.includes('/timeseries')) return 'timeseries';
    return defaultMapType ?? 'timeseries';
  }, [pathname, defaultMapType]);

  const [mapType, setMapType] = useState<MapType>(derivedMapType);

  const targetMapType: MapType = mapType === 'timeseries' ? 'accumulated' : 'timeseries';

  const targetPathname = useMemo(() => {
    if (!pathname) return `/${targetMapType}`;
    if (pathname.includes('/timeseries')) return pathname.replace('/timeseries', '/accumulated');
    if (pathname.includes('/accumulated')) return pathname.replace('/accumulated', '/timeseries');
    return pathname.endsWith('/geography') ? `${pathname}/${targetMapType}` : `${pathname}/${targetMapType}`;
  }, [pathname, targetMapType]);

  const href = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (!targetPathname.includes('/timeseries')) {
      params.set('mapNav', 'true');
    } else if (params.has('mapNav')) {
      params.delete('mapNav');
    }
    const qs = params.toString();
    return qs ? `${targetPathname}?${qs}` : targetPathname;
  }, [searchParams, targetPathname]);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    setMapType(targetMapType);
    if (onClick) onClick(e);
  };

  return (
    // TODO: Add better styling it looks like someone took a dump on it
    <button {...buttonProps} onClick={handleClick}>
      <Link href={href}>{t(`go${mapType === 'accumulated' ? 'Timeseries' : 'Accumulated'}`)}</Link>
    </button>
  );
}

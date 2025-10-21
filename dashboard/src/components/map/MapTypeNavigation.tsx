'use client';

import React, { useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type MapType = 'accumulated' | 'timeseries';

export type MapTypeNavigationProps = {
  defaultMapType?: MapType;
  className?: string;
};

export default function MapTypeNavigation(props: MapTypeNavigationProps) {
  const { defaultMapType, className } = props;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('components.geography.mapType');

  // Determine the currently selected map type
  const currentMapType: MapType = useMemo(() => {
    if (pathname?.includes('/accumulated')) return 'accumulated';
    if (pathname?.includes('/timeseries')) return 'timeseries';
    return defaultMapType ?? 'timeseries';
  }, [pathname, defaultMapType]);

  // Utility to generate the href for a given map type
  const getHref = (mapType: MapType) => {
    if (!pathname) return `/${mapType}`;

    let targetPathname = pathname;
    if (pathname.includes('/timeseries')) targetPathname = pathname.replace('/timeseries', '/accumulated');
    if (pathname.includes('/accumulated')) targetPathname = pathname.replace('/accumulated', '/timeseries');

    if (!pathname.includes('/timeseries') && mapType === 'timeseries')
      targetPathname = pathname.replace('/accumulated', '/timeseries');
    if (!pathname.includes('/accumulated') && mapType === 'accumulated')
      targetPathname = pathname.replace('/timeseries', '/accumulated');

    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (mapType === 'accumulated') {
      params.set('mapNav', 'true');
    } else {
      params.delete('mapNav');
    }

    const qs = params.toString();
    return qs ? `${targetPathname}?${qs}` : targetPathname;
  };

  const mapTypes: MapType[] = ['timeseries', 'accumulated'];

  return (
    <div className={`flex space-x-1 ${className}`}>
      {mapTypes.map((type) => (
        <Link
          key={type}
          title={t(`${type}.tooltip`)}
          href={getHref(type)}
          className={`rounded px-3 py-1 ${
            currentMapType === type
              ? 'bg-secondary text-gray-accent pointer-events-none font-semibold'
              : 'text-secondary-accent pointer-events-auto bg-transparent underline'
          }`}
        >
          {t(`${type}.label`)}
        </Link>
      ))}
    </div>
  );
}

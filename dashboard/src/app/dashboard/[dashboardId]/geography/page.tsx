import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GeographyPage({ params }: { params: { dashboardId: string } }) {
  const { dashboardId } = params;

  const hdrs = await headers();

  const userAgent = hdrs.get('user-agent') ?? '';
  const isMobile = /mobile/i.test(userAgent);

  const referer = hdrs.get('referer') ?? '';
  const queryString = referer.includes('?') ? referer.split('?')[1] : '';
  const qs = new URLSearchParams(queryString);

  // Support both 'mapNav' (preferred) and legacy 'mapType'
  const isMapNav = (qs.get('mapNav') ?? '').toLowerCase() === 'true';

  // Normalize to mapNav=true when forcing, so downstream logic can rely on one flag.
  if (isMapNav) qs.set('mapNav', 'true');

  const base =
    isMapNav || isMobile
      ? `/dashboard/${dashboardId}/geography/accumulated`
      : `/dashboard/${dashboardId}/geography/timeseries`;

  const target = qs.toString() ? `${base}?${qs.toString()}` : base;

  redirect(target);
}

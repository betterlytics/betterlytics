import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GeographyPage({ params }: { params: { dashboardId: string } }) {
  const { dashboardId } = params;

  const userAgent = (await headers()).get('user-agent') ?? '';
  const isMobile = /mobile/i.test(userAgent);

  const referer = (await headers()).get('referer') ?? '';
  const searchParams = referer.includes('?') ? referer.split('?')[1] : '';

  const target = isMobile
    ? `/dashboard/${dashboardId}/geography/accumulated${searchParams ? `?${searchParams}` : ''}`
    : `/dashboard/${dashboardId}/geography/timeseries${searchParams ? `?${searchParams}` : ''}`;

  redirect(target);
}

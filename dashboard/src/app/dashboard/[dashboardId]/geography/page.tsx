import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GeographyPage({ params }: { params: { dashboardId: string } }) {
  const { dashboardId } = params;

  const hdrs = await headers();
  const userAgent = hdrs.get('user-agent') ?? '';
  const isMobile = /mobile/i.test(userAgent);

  // Decide initial map type based purely on device
  const mapType = isMobile ? 'accumulated' : 'timeseries';

  redirect(`/dashboard/${dashboardId}/geography/${mapType}`);
}

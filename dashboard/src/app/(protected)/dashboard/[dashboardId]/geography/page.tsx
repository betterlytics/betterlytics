import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function GeographyPage({ params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;

  // Get headers to detect device
  const hdrs = await headers();
  const userAgent = hdrs.get('user-agent') ?? '';
  const isMobile = /mobile/i.test(userAgent);
  const mapType = isMobile ? 'mobile' : 'desktop';

  // Access current URL query string
  const referer = hdrs.get('referer') ?? '';
  const queryString = referer.includes('?') ? '?' + referer.split('?')[1] : '';

  redirect(`/dashboard/${dashboardId}/geography/${mapType}${queryString}`);
}

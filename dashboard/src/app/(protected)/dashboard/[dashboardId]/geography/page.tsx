import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getServerSession } from 'next-auth';

type GeographyPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function GeographyPage({ params }: GeographyPageParams) {
  const { dashboardId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  // Get headers to detect device
  const hdrs = await headers();
  const userAgent = hdrs.get('user-agent') ?? '';
  const isMobile = /mobile/i.test(userAgent);
  const mapType = isMobile ? 'mobile' : 'desktop';

  // Access current URL query string
  // (Next.js App Router doesn’t give it directly to the page component,
  // but you can reconstruct it via headers)
  const referer = hdrs.get('referer') ?? '';
  const queryString = referer.includes('?') ? '?' + referer.split('?')[1] : '';

  redirect(`/dashboard/${dashboardId}/geography/${mapType}${queryString}`);
}

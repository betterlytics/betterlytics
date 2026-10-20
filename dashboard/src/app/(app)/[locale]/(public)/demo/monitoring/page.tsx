import { redirect } from 'next/navigation';
import { compareDownFirst } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/utils';
import { fetchMonitorChecksAction } from '@/app/actions/analytics/monitoring.actions';
import type { SupportedLanguages } from '@/constants/i18n';
import { getPathname } from '@/i18n/navigation';
import { getUserTimezone } from '@/lib/cookies';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

export default async function DemoMonitoringPage({ params }: Props) {
  const { locale } = await params;
  const demoId = env.DEMO_DASHBOARD_ID;
  if (!env.IS_CLOUD || !demoId) {
    redirect(getPathname({ href: '/', locale }));
  }

  const list = `/share/${demoId}/monitoring`;
  const monitors = await fetchMonitorChecksAction(demoId, await getUserTimezone()).catch(() => []);
  const [first] = monitors.filter((monitor) => monitor.operationalState !== 'paused').sort(compareDownFirst);
  redirect(getPathname({ href: first ? `${list}/${first.id}` : list, locale }));
}

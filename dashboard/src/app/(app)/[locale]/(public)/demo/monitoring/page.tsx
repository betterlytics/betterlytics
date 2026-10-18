import { redirect } from 'next/navigation';
import type { SupportedLanguages } from '@/constants/i18n';
import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';
import { getMonitorChecks } from '@/services/analytics/monitoring.service';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

/** The demo dashboard's first monitor, or its monitor list; the uptime feature page embeds this. */
export default async function DemoMonitoringPage({ params }: Props) {
  const { locale } = await params;
  const demoId = env.DEMO_DASHBOARD_ID;
  if (!env.IS_CLOUD || !demoId) {
    redirect(getPathname({ href: '/', locale }));
  }

  const list = `/share/${demoId}/monitoring`;
  const [first] = await getMonitorChecks(demoId).catch(() => []);
  redirect(getPathname({ href: first ? `${list}/${first.id}` : list, locale }));
}

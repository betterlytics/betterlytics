import { redirect } from 'next/navigation';
import type { SupportedLanguages } from '@/constants/i18n';
import { getPathname } from '@/i18n/navigation';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: SupportedLanguages }> };

export default async function DemoErrorsPage({ params }: Props) {
  const { locale } = await params;
  const demoId = env.DEMO_DASHBOARD_ID;
  if (!env.IS_CLOUD || !demoId) {
    redirect(getPathname({ href: '/', locale }));
  }
  redirect(`${getPathname({ href: `/share/${demoId}/errors`, locale })}?interval=7d`);
}

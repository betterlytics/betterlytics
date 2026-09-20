import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

export default function DemoPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  redirect(`/share/${env.DEMO_DASHBOARD_ID}`);
}

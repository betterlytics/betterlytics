import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

export default function DemoPage() {
  redirect(`/share/${env.DEMO_DASHBOARD_ID}`);
}

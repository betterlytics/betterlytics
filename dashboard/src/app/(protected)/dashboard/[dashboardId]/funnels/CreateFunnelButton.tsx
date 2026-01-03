'use client';

import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { CreateFunnelDialog } from './CreateFunnelDialog';

export default function CreateFunnelButton() {
  const isDemo = useDashboardAuth().isDemo;
  if (isDemo) return null;
  return <CreateFunnelDialog triggerText='Create funnel' triggerVariant='outline' />;
}

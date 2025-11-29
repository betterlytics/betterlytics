'use client';

import { useDemoMode } from '@/contexts/DemoModeContextProvider';
import { CreateFunnelDialog } from './CreateFunnelDialog';

export default function CreateFunnelButton() {
  const isDemo = useDemoMode();
  if (isDemo) return null;
  return <CreateFunnelDialog triggerText='Create funnel' triggerVariant='outline' />;
}

'use client';

import { CreateFunnelDialog } from './CreateFunnelDialog';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

export default function CreateFunnelButton() {
  return (
    <PermissionGate hideWhenDisabled>
      {(disabled) => (
        <CreateFunnelDialog triggerText='Create funnel' triggerVariant='outline' disabled={disabled} />
      )}
    </PermissionGate>
  );
}

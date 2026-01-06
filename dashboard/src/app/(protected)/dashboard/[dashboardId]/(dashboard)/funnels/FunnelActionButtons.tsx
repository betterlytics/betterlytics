'use client';

import { CloneFunnelDialog } from './CloneFunnelDialog';
import { DeleteFunnelDialog } from './DeleteFunnelDialog';
import { EditFunnelDialog } from './EditFunnelDialog';
import { PresentedFunnel } from '@/presenters/toFunnel';
import { PermissionGate } from '@/components/tooltip/PermissionGate';

type FunnelActionButtonsProps = {
  funnel: PresentedFunnel;
};

export function FunnelActionButtons({ funnel }: FunnelActionButtonsProps) {
  return (
    <div className='hidden gap-2 md:flex'>
      <PermissionGate>{(disabled) => <EditFunnelDialog funnel={funnel} disabled={disabled} />}</PermissionGate>
      <PermissionGate>{(disabled) => <CloneFunnelDialog funnel={funnel} disabled={disabled} />}</PermissionGate>
      <PermissionGate>{(disabled) => <DeleteFunnelDialog funnel={funnel} disabled={disabled} />}</PermissionGate>
    </div>
  );
}

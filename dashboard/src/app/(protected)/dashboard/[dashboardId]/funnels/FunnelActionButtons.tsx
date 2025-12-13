'use client';

import { DisabledDemoTooltip } from '@/components/tooltip/DisabledDemoTooltip';
import { CloneFunnelDialog } from './CloneFunnelDialog';
import { DeleteFunnelDialog } from './DeleteFunnelDialog';
import { EditFunnelDialog } from './EditFunnelDialog';
import { PresentedFunnel } from '@/presenters/toFunnel';

type FunnelActionButtonsProps = {
  funnel: PresentedFunnel;
};

export function FunnelActionButtons({ funnel }: FunnelActionButtonsProps) {
  return (
    <div className='hidden gap-2 md:flex'>
      <DisabledDemoTooltip>
        {(isDisabled) => <EditFunnelDialog funnel={funnel} disabled={isDisabled} />}
      </DisabledDemoTooltip>
      <DisabledDemoTooltip>
        {(isDisabled) => <CloneFunnelDialog funnel={funnel} disabled={isDisabled} />}
      </DisabledDemoTooltip>
      <DisabledDemoTooltip>
        {(isDisabled) => <DeleteFunnelDialog funnel={funnel} disabled={isDisabled} />}
      </DisabledDemoTooltip>
    </div>
  );
}

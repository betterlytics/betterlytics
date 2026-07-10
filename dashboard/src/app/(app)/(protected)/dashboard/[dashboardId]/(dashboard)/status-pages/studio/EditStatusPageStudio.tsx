'use client';

import { useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { FlowOverlay } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlay';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { StudioShell } from './StudioShell';

type EditStatusPageStudioProps = {
  dashboardId: string;
  publicHost: string;
  domain: string;
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  preview: { payload: StatusPagePreviewPayload; messages: Record<string, unknown> };
  saving: boolean;
  saveBlockedReason: string | null;
  onSave: () => void;
  onClose: () => void;
};

export function EditStatusPageStudio({
  dashboardId,
  publicHost,
  domain,
  form,
  slugStatus,
  preview,
  saving,
  saveBlockedReason,
  onSave,
  onClose,
}: EditStatusPageStudioProps) {
  const t = useTranslations('statusPagesPage.editor');

  const openSnapshotRef = useRef(form.snapshot);

  const dirtySinceOpen = useMemo(
    () => form.hasStagedImages || JSON.stringify(form.snapshot) !== JSON.stringify(openSnapshotRef.current),
    [form.snapshot, form.hasStagedImages],
  );

  const saveButtons = (size: 'sm' | 'default', requestClose: () => void) => (
    <>
      <Button variant='ghost' size={size} disabled={saving} onClick={requestClose} className='cursor-pointer'>
        {t('cancel')}
      </Button>
      <PermissionGate>
        {(disabled) => (
          <DisabledTooltip disabled={!disabled && !!saveBlockedReason} message={saveBlockedReason ?? ''}>
            {() => (
              <Button
                size={size}
                disabled={disabled || saving || !dirtySinceOpen || !!saveBlockedReason}
                onClick={onSave}
                className='cursor-pointer'
              >
                {saving && <Spinner size='sm' className='mr-1.5 border-current' />}
                {t('save')}
              </Button>
            )}
          </DisabledTooltip>
        )}
      </PermissionGate>
    </>
  );

  return (
    <FlowOverlay>
      <StudioShell
        mode='edit'
        dashboardId={dashboardId}
        publicHost={publicHost}
        domain={domain}
        form={form}
        slugStatus={slugStatus}
        preview={preview}
        buttons={saveButtons}
        busy={saving}
        isDirty={dirtySinceOpen}
        discardLabels={{
          title: t('studio.discardEdits.title'),
          description: t('studio.discardEdits.description'),
          keep: t('studio.discardEdits.keep'),
          discard: t('studio.discardEdits.discard'),
        }}
        onDiscard={() => form.reset(openSnapshotRef.current)}
        onClose={onClose}
      />
    </FlowOverlay>
  );
}

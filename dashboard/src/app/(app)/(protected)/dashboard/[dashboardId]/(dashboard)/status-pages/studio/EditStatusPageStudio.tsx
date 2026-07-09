'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { ConfirmDialog } from '@/components/dialogs';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { MonitorFormDialog } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/MonitorFormDialog';
import { FlowOverlay } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlay';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import {
  newMonitorRow,
  type StatusPageFormState,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { StatusPageStudio } from './StatusPageStudio';

type EditStatusPageStudioProps = {
  dashboardId: string;
  publicHost: string;
  domain: string;
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  preview: { payload: StatusPagePreviewPayload; messages: Record<string, unknown> };
  saving: boolean;
  /** Validation blocking a save; covers the whole form — a save persists everything. */
  saveBlockedReason: string | null;
  /** Runs the editor's save (with its publish-confirm flow) and closes the studio on success. */
  onSave: () => void;
  onClose: () => void;
};

/**
 * The studio in edit mode: mounted by the detail page's Edit button, operating directly on
 * the editor's form state. Cancel/close restores the snapshot captured when the studio
 * opened, so pre-existing unsaved General-tab edits survive untouched.
 */
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [createMonitorOpen, setCreateMonitorOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const openSnapshotRef = useRef(form.snapshot);

  const dirtySinceOpen = useMemo(
    () => form.hasStagedImages || JSON.stringify(form.snapshot) !== JSON.stringify(openSnapshotRef.current),
    [form.snapshot, form.hasStagedImages],
  );

  const handleCancel = () => {
    if (saving) return;
    if (dirtySinceOpen) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const saveButtons = (size: 'sm' | 'default') => (
    <>
      <Button variant='ghost' size={size} disabled={saving} onClick={handleCancel} className='cursor-pointer'>
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

  const headerActions = (
    <>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setPreviewOpen(true)}
        className='cursor-pointer lg:hidden'
      >
        <Maximize2 className='mr-1.5 h-3.5 w-3.5' />
        {t('preview')}
      </Button>
      <div className='hidden items-center gap-2 lg:flex'>{saveButtons('sm')}</div>
    </>
  );

  const mobileBar = (
    <div className='border-border flex flex-none items-center justify-end gap-2 border-t p-3 lg:hidden'>
      {saveButtons('default')}
    </div>
  );

  return (
    <FlowOverlay>
      <StatusPageStudio
        mode='edit'
        form={form}
        slugStatus={slugStatus}
        publicHost={publicHost}
        domain={domain}
        preview={preview}
        previewError={false}
        headerActions={headerActions}
        mobileBar={mobileBar}
        onClose={handleCancel}
        onCreateMonitor={() => setCreateMonitorOpen(true)}
        previewEnlargedOpen={previewOpen}
        onPreviewEnlargedOpenChange={setPreviewOpen}
      />
      <MonitorFormDialog
        open={createMonitorOpen}
        onOpenChange={setCreateMonitorOpen}
        dashboardId={dashboardId}
        domain={domain}
        existingUrls={form.monitorRows.map((row) => row.url)}
        onCreated={(monitor) => form.setMonitorRows((rows) => [...rows, newMonitorRow(monitor)])}
      />
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={t('studio.discardEdits.title')}
        description={t('studio.discardEdits.description')}
        cancelLabel={t('studio.discardEdits.keep')}
        confirmLabel={t('studio.discardEdits.discard')}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          form.reset(openSnapshotRef.current);
          onClose();
        }}
      />
    </FlowOverlay>
  );
}

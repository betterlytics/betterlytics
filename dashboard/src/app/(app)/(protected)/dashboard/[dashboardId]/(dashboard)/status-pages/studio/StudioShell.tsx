'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { CreateMonitorDialog } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/CreateMonitorDialog';
import { ConfirmDialog } from '@/components/dialogs';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { newMonitorRow } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/monitorRow';
import { StatusPageStudio } from './StatusPageStudio';

type StudioShellProps = {
  mode: 'create' | 'edit';
  dashboardId: string;
  publicHost: string;
  domain: string;
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  preview: { payload: StatusPagePreviewPayload; messages: Record<string, unknown> } | null;
  previewError?: boolean;
  /** Disables the mobile enlarge-preview button */
  previewDisabled?: boolean;
  buttons: (size: 'sm' | 'default', requestClose: () => void) => ReactNode;
  busy: boolean;
  isDirty: boolean;
  discardLabels: { title: string; description: string; keep: string; discard: string };
  /** Runs after the user confirms discarding, before the shell calls `onClose`. */
  onDiscard?: () => void;
  onClose: () => void;
  /** Runs after a monitor created via the dialog has been appended to the form. */
  onMonitorCreated?: () => void;
};

export function StudioShell({
  mode,
  dashboardId,
  publicHost,
  domain,
  form,
  slugStatus,
  preview,
  previewError = false,
  previewDisabled = false,
  buttons,
  busy,
  isDirty,
  discardLabels,
  onDiscard,
  onClose,
  onMonitorCreated,
}: StudioShellProps) {
  const t = useTranslations('statusPagesPage.editor');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [createMonitorOpen, setCreateMonitorOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const requestClose = () => {
    if (busy || showDiscardConfirm) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const headerActions = (
    <>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setPreviewOpen(true)}
        disabled={previewDisabled}
        className='cursor-pointer lg:hidden'
      >
        <Maximize2 className='mr-1.5 h-3.5 w-3.5' />
        {t('preview')}
      </Button>
      <div className='hidden items-center gap-2 lg:flex'>{buttons('sm', requestClose)}</div>
    </>
  );

  const mobileBar = (
    <div className='border-border flex flex-none items-center justify-end gap-2 border-t p-3 lg:hidden'>
      {buttons('default', requestClose)}
    </div>
  );

  return (
    <>
      <StatusPageStudio
        mode={mode}
        form={form}
        slugStatus={slugStatus}
        publicHost={publicHost}
        domain={domain}
        preview={preview}
        previewError={previewError}
        headerActions={headerActions}
        mobileBar={mobileBar}
        onClose={requestClose}
        onCreateMonitor={() => setCreateMonitorOpen(true)}
        previewEnlargedOpen={previewOpen}
        onPreviewEnlargedOpenChange={setPreviewOpen}
      />
      <CreateMonitorDialog
        open={createMonitorOpen}
        onOpenChange={setCreateMonitorOpen}
        dashboardId={dashboardId}
        domain={domain}
        existingUrls={form.monitorRows.map((row) => row.url)}
        onCreated={(monitor) => {
          form.setMonitorRows((rows) => [...rows, newMonitorRow(monitor)]);
          onMonitorCreated?.();
        }}
      />
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={discardLabels.title}
        description={discardLabels.description}
        cancelLabel={discardLabels.keep}
        confirmLabel={discardLabels.discard}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onDiscard?.();
          onClose();
        }}
      />
    </>
  );
}

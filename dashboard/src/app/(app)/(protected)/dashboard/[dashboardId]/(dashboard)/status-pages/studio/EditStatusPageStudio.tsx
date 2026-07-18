'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { DisabledTooltip } from '@/components/tooltip/DisabledTooltip';
import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import { fetchStatusPageStudioDataAction } from '@/app/actions/analytics/statusPage.actions';
import { FlowOverlay } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlay';
import { FlowOverlayHeader } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlayHeader';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { type MonitorRow } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/monitorRow';
import { StudioShell } from './StudioShell';

type StudioData = NonNullable<Awaited<ReturnType<typeof fetchStatusPageStudioDataAction>>>;

type EditStatusPageStudioProps = {
  dashboardId: string;
  statusPageId: string;
  publicHost: string;
  domain: string;
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  saving: boolean;
  saveBlockedReason: string | null;
  onSave: () => void;
  onClose: () => void;
};

function mergeMonitorRows(rows: MonitorRow[], monitors: StudioData['monitors']): MonitorRow[] {
  const byId = new Map(monitors.map((monitor) => [monitor.id, monitor]));

  const existing = rows.flatMap((row) => {
    const monitor = byId.get(row.monitorCheckId);
    return monitor
      ? [
          {
            ...row,
            name: monitor.name,
            url: monitor.url,
            operationalState: monitor.operationalState,
            uptimePercent: monitor.uptimePercent,
          },
        ]
      : [];
  });
  const seen = new Set(rows.map((row) => row.monitorCheckId));
  const added = monitors
    .filter((monitor) => !seen.has(monitor.id))
    .map((monitor) => ({
      monitorCheckId: monitor.id,
      name: monitor.name,
      url: monitor.url,
      included: false,
      publicName: defaultPublicMonitorName(monitor),
      operationalState: monitor.operationalState,
      uptimePercent: monitor.uptimePercent,
    }));

  return [...existing, ...added];
}

function StudioBody({
  dashboardId,
  publicHost,
  domain,
  form,
  slugStatus,
  data,
  saving,
  saveBlockedReason,
  onSave,
  onClose,
  openSnapshot,
}: Omit<EditStatusPageStudioProps, 'statusPageId'> & {
  data: StudioData;
  openSnapshot: StatusPageFormState['snapshot'];
}) {
  const t = useTranslations('statusPagesPage.editor');

  const openSnapshotRef = useRef(openSnapshot);

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
    <StudioShell
      mode='edit'
      dashboardId={dashboardId}
      publicHost={publicHost}
      domain={domain}
      form={form}
      slugStatus={slugStatus}
      preview={{ payload: data.payload, messages: data.messages }}
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
  );
}

export function EditStatusPageStudio(props: EditStatusPageStudioProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { dashboardId, statusPageId, form, onClose } = props;

  const studioQuery = useQuery({
    queryKey: ['statusPageStudio', dashboardId, statusPageId],
    queryFn: () => fetchStatusPageStudioDataAction(dashboardId, statusPageId),
    staleTime: Infinity,
    gcTime: 0,
  });

  const [openSnapshot, setOpenSnapshot] = useState<StatusPageFormState['snapshot'] | null>(null);
  useEffect(() => {
    if (!studioQuery.data || openSnapshot) return;
    const mergedRows = mergeMonitorRows(form.monitorRows, studioQuery.data.monitors);
    form.setMonitorRows(mergedRows);
    setOpenSnapshot({ ...form.snapshot, monitorRows: mergedRows });
  }, [studioQuery.data, openSnapshot, form]);

  return (
    <FlowOverlay>
      {studioQuery.data && openSnapshot ? (
        <StudioBody {...props} data={studioQuery.data} openSnapshot={openSnapshot} />
      ) : (
        <>
          <FlowOverlayHeader
            title={form.name.trim() || t('wizard.title')}
            closeAriaLabel={t('wizard.close')}
            onClose={onClose}
          />
          <div className='flex flex-1 items-center justify-center py-20'>
            {studioQuery.isPending || studioQuery.data ? (
              <div className='text-muted-foreground flex flex-col items-center gap-3'>
                <Spinner />
                <span className='text-sm'>{t('wizard.loading')}</span>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>{t('error')}</p>
            )}
          </div>
        </>
      )}
    </FlowOverlay>
  );
}

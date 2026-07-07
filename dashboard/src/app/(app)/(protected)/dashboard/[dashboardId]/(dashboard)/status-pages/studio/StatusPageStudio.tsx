'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { type SlugStatus } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/constants';
import { FlowOverlayHeader } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/FlowOverlayHeader';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';
import { StudioTabs, type StudioTab } from './StudioTabs';
import { StudioCanvas } from './StudioCanvas';
import { MonitorsPanel } from './panels/MonitorsPanel';
import { BrandingPanel } from './panels/BrandingPanel';
import { PublishPanel } from './panels/PublishPanel';

type StatusPageStudioProps = {
  /** 'create' shows the Publish tab (initial address/visibility/domain); 'edit' is design-only. */
  mode: 'create' | 'edit';
  /** Owned by the caller — the studio never fetches or persists anything itself. */
  form: StatusPageFormState;
  slugStatus: SlugStatus;
  publicHost: string;
  domain: string;
  preview: { payload: StatusPagePreviewPayload; messages: Record<string, unknown> } | null;
  previewError: boolean;
  /** Which tab opens first — lets future entry points deep-link (e.g. edit-from-branding). */
  initialTab?: StudioTab;
  /** Header commit cluster — the caller decides the semantics (Save draft/Publish vs Save/Cancel). */
  headerActions: ReactNode;
  /** Optional bottom bar for small screens (the panel is full-width there, canvas hidden). */
  mobileBar?: ReactNode;
  onClose: () => void;
  onCreateMonitor: () => void;
  /** The mobile "Preview" trigger lives in headerActions, so the dialog is controlled from outside. */
  previewEnlargedOpen: boolean;
  onPreviewEnlargedOpenChange: (open: boolean) => void;
};

/**
 * The status-page studio: a fullscreen preview-centered editor. Left panel holds the
 * configuration tabs, the canvas renders the live page. Purely controlled — data
 * loading, validation gating and persistence belong to the caller.
 */
export function StatusPageStudio({
  mode,
  form,
  slugStatus,
  publicHost,
  domain,
  preview,
  previewError,
  initialTab,
  headerActions,
  mobileBar,
  onClose,
  onCreateMonitor,
  previewEnlargedOpen,
  onPreviewEnlargedOpenChange,
}: StatusPageStudioProps) {
  const t = useTranslations('statusPagesPage.editor');

  const tabs = useMemo<StudioTab[]>(
    () => (mode === 'create' ? ['monitors', 'branding', 'publish'] : ['monitors', 'branding']),
    [mode],
  );
  const [activeTab, setActiveTab] = useState<StudioTab>(initialTab ?? 'monitors');

  const slugBlocked = slugStatus === 'taken' || slugStatus === 'invalid';
  // Attention dots replace the wizard's per-step gating: every tab is reachable, problems stay visible.
  const issues: Partial<Record<StudioTab, boolean>> = {
    monitors: form.includedCount === 0,
    branding: form.isNameEmpty || !form.isHomepageUrlValid,
    publish: slugBlocked || !form.isCustomDomainValid,
  };

  return (
    <>
      <FlowOverlayHeader
        title={
          <span className='flex items-center gap-2'>
            <span className='truncate'>{form.name.trim() || t('wizard.title')}</span>
            {mode === 'create' && (
              <span className='border-border text-muted-foreground flex-none rounded-full border px-2 py-0.5 text-[11px] font-medium'>
                {t('studio.draft')}
              </span>
            )}
          </span>
        }
        closeAriaLabel={t('wizard.close')}
        onClose={onClose}
        actions={headerActions}
      />

      <div className='flex min-h-0 flex-1 overflow-hidden'>
        <div className='border-border flex w-full min-w-0 flex-col lg:w-[480px] lg:flex-none lg:border-r'>
          <div className='px-5 pt-5 sm:px-6'>
            <StudioTabs tabs={tabs} active={activeTab} onChange={setActiveTab} issues={issues} />
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto px-5 pt-8 pb-6 sm:px-6'>
            {activeTab === 'monitors' && <MonitorsPanel form={form} onCreateMonitor={onCreateMonitor} />}
            {activeTab === 'branding' && <BrandingPanel form={form} />}
            {activeTab === 'publish' && (
              <PublishPanel form={form} slugStatus={slugStatus} publicHost={publicHost} domain={domain} />
            )}
          </div>
        </div>

        <StudioCanvas
          form={form}
          preview={preview}
          previewError={previewError}
          publicHost={publicHost}
          enlargedOpen={previewEnlargedOpen}
          onEnlargedOpenChange={onPreviewEnlargedOpenChange}
        />
      </div>

      {mobileBar}
    </>
  );
}

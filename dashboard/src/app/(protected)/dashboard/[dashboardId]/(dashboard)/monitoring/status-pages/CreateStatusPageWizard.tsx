'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Maximize2, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import {
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  defaultPublicMonitorName,
} from '@/entities/analytics/statusPage.entities';
import { ConfirmDialog } from '@/components/dialogs';
import {
  createStatusPageAction,
  fetchStatusPageDraftPreviewAction,
  setStatusPagePublishedAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';
import { MonitorFormDialog } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/MonitorFormDialog';
import { FlowOverlay } from './shared/FlowOverlay';
import { FlowOverlayHeader } from './shared/FlowOverlayHeader';
import { LivePreview } from './shared/LivePreview';
import { useStatusPageFormState } from './shared/useStatusPageFormState';
import { useSlugAvailability } from './shared/useSlugAvailability';
import { STEPS, type Step } from './wizard/steps';
import { WizardStepper } from './wizard/WizardStepper';
import { MobileStepProgress } from './wizard/MobileStepProgress';
import { PreviewLoadingFrame } from './wizard/PreviewLoadingFrame';
import { WizardActions } from './wizard/WizardActions';
import { SelectStep } from './wizard/SelectStep';
import { CustomizeStep } from './wizard/CustomizeStep';
import { PublishStep } from './wizard/PublishStep';
import { PublishSuccess } from './wizard/PublishSuccess';

type WizardDefaults = Awaited<ReturnType<typeof suggestStatusPageDefaultsAction>>;

type CreateStatusPageWizardProps = {
  dashboardId: string;
  publicHost: string;
  publicBaseUrl: string;
  domain: string;
  onClose: () => void;
};

function WizardForm({
  dashboardId,
  publicHost,
  publicBaseUrl,
  domain,
  defaults,
  onClose,
}: CreateStatusPageWizardProps & { defaults: WizardDefaults }) {
  const t = useTranslations('statusPagesPage.editor');
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createMonitorOpen, setCreateMonitorOpen] = useState(false);
  const [created, setCreated] = useState<{ id: string; slug: string } | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const form = useStatusPageFormState({
    name: defaults.name,
    slug: defaults.slug,
    theme: 'system',
    accentColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR,
    showPastIncidents: true,
    visibility: 'public',
    monitorRows: defaults.monitors.map((monitor) => ({
      monitorCheckId: monitor.monitorCheckId,
      name: monitor.name,
      url: monitor.url,
      included: true,
      publicName: monitor.publicName,
      operationalState: monitor.operationalState,
      uptimePercent: monitor.uptimePercent,
    })),
  });
  const slugStatus = useSlugAvailability({ dashboardId, slug: form.slug });

  const commitMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const page = await createStatusPageAction(dashboardId, form.input);
      if (publish) await setStatusPagePublishedAction(dashboardId, page.id, true);
      return { page, publish };
    },
    onSuccess: ({ page, publish }) => {
      if (publish) {
        setCreated({ id: page.id, slug: page.slug });
      } else {
        router.push(`/dashboard/${dashboardId}/monitoring/status-pages/${page.id}`);
      }
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('error')),
  });

  const stepLabels: Record<Step, string> = {
    select: t('wizard.steps.select'),
    customize: t('wizard.steps.customize'),
    publish: t('wizard.steps.publish'),
  };

  const slugBlocked = slugStatus === 'taken' || slugStatus === 'invalid';
  const hasMonitors = form.includedCount > 0;
  const canContinue = step === 0 ? hasMonitors : step === 1 ? !form.isNameEmpty && form.isHomepageUrlValid : true;
  const canCommit =
    hasMonitors &&
    !form.isNameEmpty &&
    !slugBlocked &&
    form.isHomepageUrlValid &&
    form.isCustomDomainValid &&
    !commitMutation.isPending;
  const isLast = step === STEPS.length - 1;
  const submittingPublish = commitMutation.isPending && commitMutation.variables === true;
  const submittingDraft = commitMutation.isPending && commitMutation.variables === false;

  const monitorsDirty =
    form.monitorRows.length !== defaults.monitors.length ||
    form.monitorRows.some((row, i) => {
      const def = defaults.monitors[i];
      return (
        !def || row.monitorCheckId !== def.monitorCheckId || !row.included || row.publicName !== def.publicName
      );
    });

  const isDirty =
    form.name !== defaults.name ||
    form.slug !== defaults.slug ||
    form.theme !== 'system' ||
    form.accentColor !== STATUS_PAGE_DEFAULT_ACCENT_COLOR ||
    !form.showPastIncidents ||
    form.visibility !== 'public' ||
    form.homepageUrl.trim() !== '' ||
    form.customDomain.trim() !== '' ||
    monitorsDirty;

  const goNext = useCallback(() => {
    setDirection('forward');
    setStep((s) => s + 1);
  }, []);

  const handleClose = useCallback(() => {
    if (commitMutation.isPending) return;
    if (showDiscardConfirm) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [commitMutation.isPending, showDiscardConfirm, isDirty, onClose]);

  const previewQuery = useQuery({
    queryKey: ['statusPageDraftPreview', dashboardId],
    queryFn: () => fetchStatusPageDraftPreviewAction(dashboardId),
    staleTime: Infinity,
    gcTime: 0,
  });

  if (created) {
    return (
      <PublishSuccess
        dashboardId={dashboardId}
        created={created}
        publicHost={publicHost}
        publicBaseUrl={publicBaseUrl}
      />
    );
  }

  const goBack = () => {
    setDirection('back');
    setStep((s) => s - 1);
  };

  const navProps = {
    step,
    isLast,
    canContinue,
    canCommit,
    submittingDraft,
    submittingPublish,
    onBack: goBack,
    onNext: goNext,
    onPublish: () => commitMutation.mutate(true),
    onSaveDraft: () => commitMutation.mutate(false),
  };

  const actions = (
    <>
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={() => setPreviewOpen(true)}
        disabled={!previewQuery.data}
        className='cursor-pointer lg:hidden'
      >
        <Maximize2 className='mr-1.5 h-3.5 w-3.5' />
        {t('preview')}
      </Button>
      <WizardActions layout='header' {...navProps} />
    </>
  );

  return (
    <>
      <FlowOverlayHeader
        title={t('wizard.title')}
        closeAriaLabel={t('wizard.close')}
        onClose={handleClose}
        center={
          <WizardStepper
            current={step}
            labels={stepLabels}
            onJump={(index) => {
              setDirection('back');
              setStep(index);
            }}
          />
        }
        actions={actions}
      />
      <MobileStepProgress step={step} />
      <div className='flex min-h-0 flex-1 justify-center overflow-hidden'>
        <div className='flex min-h-0 w-full max-w-6xl'>
          <div className='flex-1 overflow-y-auto'>
            <div className='mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10'>
              <div
                key={step}
                className={cn(
                  'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200',
                  direction === 'forward'
                    ? 'motion-safe:slide-in-from-right-3'
                    : 'motion-safe:slide-in-from-left-3',
                )}
              >
                {step === 0 && <SelectStep form={form} onCreateMonitor={() => setCreateMonitorOpen(true)} />}
                {step === 1 && <CustomizeStep form={form} />}
                {step === 2 && (
                  <PublishStep
                    form={form}
                    slugStatus={slugStatus}
                    publicHost={publicHost}
                    publicBaseUrl={publicBaseUrl}
                    domain={domain}
                  />
                )}
              </div>
            </div>
          </div>

          <aside className='hidden min-h-0 w-[500px] flex-none overflow-y-auto lg:block'>
            <div className='min-h-full py-8 pr-2 pl-6 sm:py-10'>
              {previewQuery.data ? (
                <div className='group relative'>
                  <LivePreview
                    payload={previewQuery.data.payload}
                    messages={previewQuery.data.messages}
                    publicHost={publicHost}
                    draft={form.previewDraft}
                  />
                  <button
                    type='button'
                    onClick={() => setPreviewOpen(true)}
                    aria-label={t('wizard.enlargePreview')}
                    className='absolute inset-0 flex cursor-pointer items-center justify-center rounded-xl opacity-0 transition-opacity hover:bg-black/30 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none'
                  >
                    <span className='flex items-center gap-1.5 rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-sm'>
                      <Maximize2 className='h-3.5 w-3.5' />
                      {t('wizard.enlargePreview')}
                    </span>
                  </button>
                </div>
              ) : previewQuery.isError ? (
                <p className='text-muted-foreground pt-10 text-sm'>{t('error')}</p>
              ) : (
                <PreviewLoadingFrame publicHost={publicHost} slug={form.slug} />
              )}
            </div>
          </aside>
        </div>
      </div>
      <WizardActions layout='bar' {...navProps} />
      {previewQuery.data && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className='data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-[min(96vw,1080px)] -translate-x-1/2 -translate-y-1/2 duration-200'
            >
              <DialogTitle className='sr-only'>{t('preview')}</DialogTitle>
              <LivePreview
                payload={previewQuery.data.payload}
                messages={previewQuery.data.messages}
                publicHost={publicHost}
                draft={form.previewDraft}
                zoom={0.85}
                centerUrl
                className='max-h-[88vh]'
                chromeRight={
                  <DialogClose
                    aria-label={t('wizard.close')}
                    className='text-muted-foreground hover:text-foreground hover:bg-muted -mr-1 flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded transition-colors'
                  >
                    <X className='h-4 w-4' />
                  </DialogClose>
                }
              />
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
      <MonitorFormDialog
        open={createMonitorOpen}
        onOpenChange={setCreateMonitorOpen}
        dashboardId={dashboardId}
        domain={domain}
        existingUrls={form.monitorRows.map((row) => row.url)}
        onCreated={(monitor) => {
          form.setMonitorRows((rows) => [
            ...rows,
            {
              monitorCheckId: monitor.id,
              name: monitor.name ?? null,
              url: monitor.url,
              included: true,
              publicName: defaultPublicMonitorName(monitor),
              operationalState: 'preparing',
              uptimePercent: null,
            },
          ]);
          previewQuery.refetch();
        }}
      />
      <ConfirmDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title={t('wizard.confirmDiscard.title')}
        description={t('wizard.confirmDiscard.description')}
        cancelLabel={t('wizard.confirmDiscard.keep')}
        confirmLabel={t('wizard.confirmDiscard.discard')}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onClose();
        }}
      />
    </>
  );
}

export function CreateStatusPageWizard({
  dashboardId,
  publicHost,
  publicBaseUrl,
  domain,
  onClose,
}: CreateStatusPageWizardProps) {
  const t = useTranslations('statusPagesPage.editor');
  const defaultsQuery = useQuery({
    queryKey: ['statusPageDefaults', dashboardId],
    queryFn: () => suggestStatusPageDefaultsAction(dashboardId),
    staleTime: 0,
    gcTime: 0,
  });

  return (
    <FlowOverlay>
      {defaultsQuery.data ? (
        <WizardForm
          dashboardId={dashboardId}
          publicHost={publicHost}
          publicBaseUrl={publicBaseUrl}
          domain={domain}
          defaults={defaultsQuery.data}
          onClose={onClose}
        />
      ) : (
        <>
          <FlowOverlayHeader title={t('wizard.title')} closeAriaLabel={t('wizard.close')} onClose={onClose} />
          <div className='flex flex-1 items-center justify-center py-20'>
            {defaultsQuery.isError ? <p className='text-muted-foreground text-sm'>{t('error')}</p> : <Spinner />}
          </div>
        </>
      )}
    </FlowOverlay>
  );
}

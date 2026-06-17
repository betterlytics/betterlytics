'use client';

import { Fragment, useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Check, Maximize2, MoveLeft, MoveRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage.entities';
import { ConfirmDialog } from '@/components/dialogs';
import {
  createStatusPageAction,
  fetchStatusPageDraftPreviewAction,
  setStatusPagePublishedAction,
  suggestStatusPageDefaultsAction,
} from '@/app/actions/analytics/statusPage.actions';
import { FlowOverlay } from './shared/FlowOverlay';
import { FlowOverlayHeader } from './shared/FlowOverlayHeader';
import { LivePreview } from './shared/LivePreview';
import { useStatusPageFormState } from './shared/useStatusPageFormState';
import { useSlugAvailability } from './shared/useSlugAvailability';
import { SelectStep } from './wizard/SelectStep';
import { CustomizeStep } from './wizard/CustomizeStep';
import { PublishStep } from './wizard/PublishStep';
import { PublishSuccess } from './wizard/PublishSuccess';
import { useOverlayReset } from '@/hooks/use-overlay-reset';
import { useCreateMonitor } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/shared/hooks/useCreateMonitor';
import { CreateMonitorForm } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/monitoring/CreateMonitorForm';

const STEPS = ['select', 'customize', 'publish'] as const;
type Step = (typeof STEPS)[number];

type WizardDefaults = Awaited<ReturnType<typeof suggestStatusPageDefaultsAction>>;

type CreateStatusPageWizardProps = {
  dashboardId: string;
  publicHost: string;
  publicBaseUrl: string;
  domain: string;
  onClose: () => void;
};

function WizardStepper({
  current,
  labels,
  onJump,
}: {
  current: number;
  labels: Record<Step, string>;
  onJump: (index: number) => void;
}) {
  return (
    <div className='flex items-center gap-3'>
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        // The connector leading into this step is filled once we've reached it.
        const connectorFilled = index <= current;
        return (
          <Fragment key={step}>
            {index > 0 && (
              <span className='bg-border relative h-0.5 w-8 overflow-hidden rounded-full' aria-hidden>
                <span
                  className={cn(
                    'absolute inset-0 origin-left bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
                    connectorFilled ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </span>
            )}
            <button
              type='button'
              disabled={!done}
              aria-current={active ? 'step' : undefined}
              onClick={() => done && onJump(index)}
              className={cn('group flex items-center gap-2', done ? 'cursor-pointer' : 'cursor-default')}
            >
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold motion-safe:transition-all motion-safe:duration-300',
                  done || active
                    ? 'bg-emerald-500 text-emerald-950'
                    : 'border-border text-muted-foreground border',
                  active && 'ring-offset-background ring-2 ring-emerald-500/30 ring-offset-2',
                )}
              >
                {done ? <Check className='h-3.5 w-3.5' strokeWidth={3} /> : index + 1}
              </span>
              <span className='grid text-xs'>
                <span aria-hidden className='invisible col-start-1 row-start-1 font-semibold'>
                  {labels[step]}
                </span>
                <span
                  className={cn(
                    'col-start-1 row-start-1 whitespace-nowrap transition-colors',
                    active
                      ? 'text-foreground font-semibold'
                      : done
                        ? 'text-muted-foreground group-hover:text-foreground'
                        : 'text-muted-foreground',
                  )}
                >
                  {labels[step]}
                </span>
              </span>
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}

function PreviewLoadingFrame({ publicHost, slug }: { publicHost: string; slug: string }) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='bg-card border-border flex flex-col overflow-hidden rounded-xl border'>
      <div className='border-border flex flex-none items-center gap-1.5 border-b px-3 py-2'>
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted text-muted-foreground ml-2 min-w-0 flex-1 truncate rounded-md px-2.5 py-0.5 text-xs'>
          {`${publicHost}/status/${slug}`}
        </span>
      </div>
      <div className='flex min-h-[360px] flex-col items-center justify-center gap-3'>
        <Spinner size='sm' />
        <span className='text-muted-foreground text-sm'>{t('loadingPreview')}</span>
      </div>
    </div>
  );
}

/** Compact step indicator for mobile, where the full {@link WizardStepper} is hidden. */
function MobileStepProgress({ step }: { step: number }) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='border-border flex items-center gap-3 border-b px-4 py-2.5 lg:hidden'>
      <div className='flex flex-1 gap-1.5' aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s} className='bg-border relative h-1 flex-1 overflow-hidden rounded-full'>
            <span
              className={cn(
                'absolute inset-0 origin-left rounded-full bg-emerald-500 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out',
                i <= step ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </span>
        ))}
      </div>
      <span className='text-muted-foreground grid flex-none text-xs font-medium'>
        {STEPS.map((s, i) => (
          <span
            key={s}
            aria-hidden={i !== step}
            className={cn('col-start-1 row-start-1 text-right whitespace-nowrap', i !== step && 'invisible')}
          >
            {t(`wizard.steps.${s}`)}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Bottom-anchored nav/commit actions for mobile; the desktop equivalent lives in the header. */
function MobileActionBar({
  step,
  isLast,
  canContinue,
  canCommit,
  submittingDraft,
  submittingPublish,
  onBack,
  onNext,
  onPublish,
  onSaveDraft,
}: {
  step: number;
  isLast: boolean;
  canContinue: boolean;
  canCommit: boolean;
  submittingDraft: boolean;
  submittingPublish: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
}) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='border-border flex flex-none flex-col gap-2 border-t p-3 lg:hidden'>
      {isLast && (
        <Button
          variant='ghost'
          disabled={!canCommit}
          onClick={onSaveDraft}
          className='text-muted-foreground w-full cursor-pointer'
        >
          {submittingDraft && <Spinner size='sm' className='mr-1.5 border-current' />}
          {t('wizard.saveDraft')}
        </Button>
      )}
      <div className='flex items-center gap-2'>
        {step > 0 && (
          <Button variant='outline' onClick={onBack} className='flex-none cursor-pointer'>
            <MoveLeft className='mr-1.5 h-4 w-4' />
            {t('wizard.back')}
          </Button>
        )}
        {isLast ? (
          <Button disabled={!canCommit} onClick={onPublish} className='flex-1 cursor-pointer'>
            {submittingPublish && <Spinner size='sm' className='mr-1.5 border-current' />}
            {t('publish')}
          </Button>
        ) : (
          <Button disabled={!canContinue} onClick={onNext} className='flex-1 cursor-pointer'>
            {t('wizard.continue')}
            <MoveRight className='ml-1.5 h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}

function WizardForm({
  dashboardId,
  publicHost,
  publicBaseUrl,
  domain,
  defaults,
  onClose,
}: CreateStatusPageWizardProps & { defaults: WizardDefaults }) {
  const t = useTranslations('statusPagesPage.editor');
  const tMonitorForm = useTranslations('monitoringPage.form');
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
      const page = await createStatusPageAction(dashboardId, {
        name: form.name.trim(),
        slug: form.slug,
        theme: form.theme,
        accentColor: form.accentColor,
        showPastIncidents: form.showPastIncidents,
        monitors: form.monitorsPayload,
      });
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

  const nameEmpty = form.name.trim().length === 0;
  const slugBlocked = slugStatus === 'taken' || slugStatus === 'invalid';
  const canContinue = step !== 1 || !nameEmpty;
  const canCommit = !nameEmpty && !slugBlocked && !commitMutation.isPending;
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

  const markPendingRef = useRef<() => void>(() => {});
  const createMonitor = useCreateMonitor({
    dashboardId,
    domain,
    existingUrls: form.monitorRows.map((row) => row.url),
    onCreated: (monitor) => {
      form.setMonitorRows((rows) => [
        ...rows,
        {
          monitorCheckId: monitor.id,
          name: monitor.name ?? null,
          url: monitor.url,
          included: true,
          publicName: monitor.name ?? monitor.url,
          operationalState: 'preparing',
          uptimePercent: null,
        },
      ]);
      markPendingRef.current();
      setCreateMonitorOpen(false);
      previewQuery.refetch();
    },
  });
  const { markPending: markCreateMonitorPending, onAnimationEnd: onCreateMonitorAnimationEnd } = useOverlayReset(
    createMonitor.reset,
  );
  markPendingRef.current = markCreateMonitorPending;

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
      <div className='hidden items-center gap-2 lg:flex'>
        {step > 0 && (
          <Button variant='outline' size='sm' onClick={goBack} className='cursor-pointer'>
            <MoveLeft className='mr-1.5 h-3.5 w-3.5' />
            {t('wizard.back')}
          </Button>
        )}
        {isLast ? (
          <>
            <Button
              variant='outline'
              size='sm'
              disabled={!canCommit}
              onClick={() => commitMutation.mutate(false)}
              className='cursor-pointer'
            >
              {submittingDraft && <Spinner size='sm' className='mr-1.5 border-current' />}
              {t('wizard.saveDraft')}
            </Button>
            <Button
              size='sm'
              disabled={!canCommit}
              onClick={() => commitMutation.mutate(true)}
              className='cursor-pointer'
            >
              {submittingPublish && <Spinner size='sm' className='mr-1.5 border-current' />}
              {t('publish')}
            </Button>
          </>
        ) : (
          <Button size='sm' disabled={!canContinue} onClick={goNext} className='cursor-pointer'>
            {t('wizard.continue')}
            <MoveRight className='ml-1.5 h-3.5 w-3.5' />
          </Button>
        )}
      </div>
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
      <MobileActionBar
        step={step}
        isLast={isLast}
        canContinue={canContinue}
        canCommit={canCommit}
        submittingDraft={submittingDraft}
        submittingPublish={submittingPublish}
        onBack={goBack}
        onNext={goNext}
        onPublish={() => commitMutation.mutate(true)}
        onSaveDraft={() => commitMutation.mutate(false)}
      />
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
      <Dialog open={createMonitorOpen} onOpenChange={setCreateMonitorOpen}>
        <DialogContent
          className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'
          onAnimationEnd={onCreateMonitorAnimationEnd}
        >
          <DialogHeader>
            <DialogTitle>{tMonitorForm('title')}</DialogTitle>
          </DialogHeader>
          <CreateMonitorForm
            create={createMonitor}
            domain={domain}
            onCancel={() => {
              markCreateMonitorPending();
              setCreateMonitorOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
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
            {defaultsQuery.isError ? (
              <p className='text-muted-foreground text-sm'>{t('error')}</p>
            ) : (
              <Spinner />
            )}
          </div>
        </>
      )}
    </FlowOverlay>
  );
}

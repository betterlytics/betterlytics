'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { isUrlOnDomain } from '@/utils/domainValidation';
import { useMonitorForm } from './shared/hooks/useMonitorForm';
import { TimingSection, AlertsSection, AdvancedSettingsSection } from './shared/components';
import { normalizeUrl } from '@/utils/domainValidation';
import { UpgradeButton } from '@/components/billing/UpgradeButton';

type CreateMonitorDialogProps = {
  dashboardId: string;
  domain: string;
  existingUrls: string[];
  disabled?: boolean;
  monitorCount: number;
  maxMonitors: number;
  atLimit: boolean;
};

type Section = 'timing' | 'alerts' | 'advanced' | null;

export function CreateMonitorDialog({
  dashboardId,
  domain,
  existingUrls,
  disabled,
  monitorCount,
  maxMonitors,
  atLimit,
}: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(`https://${domain}`);
  const [expandedSection, setExpandedSection] = useState<Section>('timing');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('monitoringPage.form');
  const { data: session } = useSession();

  const form = useMonitorForm({ mode: 'create' });

  const resetForm = () => {
    setUrl(`https://${domain}`);
    setExpandedSection('timing');
    form.reset();
  };

  const onSubmit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    startTransition(async () => {
      try {
        const payload = form.buildCreatePayload(url.trim());
        await createMonitorCheckAction(dashboardId, payload);
        toast.success(t('success'), {
          icon: <CheckCircle2 className='h-4 w-4 text-emerald-500' />,
          description: t('successDescription'),
        });
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  };

  const nameAtLimit = (form.state.name?.length ?? 0) >= MONITOR_LIMITS.NAME_MAX;
  const urlAtLimit = url.length >= MONITOR_LIMITS.URL_MAX;

  const urlEmpty = !url.trim();
  const urlInvalid = !urlEmpty && !isUrlOnDomain(url, domain);

  const hasCustomPort = (() => {
    try {
      const parsed = new URL(url.trim());
      return parsed.port !== '';
    } catch {
      return false;
    }
  })();

  const normalizedNewUrl = normalizeUrl(url);
  const existingNormalizedUrls = new Set(existingUrls.map(normalizeUrl).filter((u): u is string => u !== null));
  const isDuplicate = normalizedNewUrl !== null && existingNormalizedUrls.has(normalizedNewUrl);

  const hasValidProtocol = url.trim().startsWith('https://') || url.trim().startsWith('http://');
  const invalidProtocol = !urlEmpty && !hasValidProtocol;

  const hasError = urlEmpty || urlInvalid || hasCustomPort || isDuplicate || invalidProtocol;

  const isHttps = url.trim().startsWith('https://');
  const sslMonitoringEnabled = isHttps && form.state.checkSslErrors;

  if (atLimit) {
    return <UpgradeButton>{t('upgradeToCreate')}</UpgradeButton>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className='cursor-pointer whitespace-nowrap' disabled={disabled}>
          {t('create')}
          <span className='ml-1.5 text-xs opacity-70'>
            ({monitorCount}/{maxMonitors})
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className='space-y-6 pt-2'>
          <div className='space-y-2'>
            <div className='flex items-baseline gap-2'>
              <Label htmlFor='monitor-name'>{t('fields.name')}</Label>
              <span className='text-muted-foreground text-xs'>{t('helper.nameOptional')}</span>
            </div>
            <Input
              id='monitor-name'
              value={form.state.name ?? ''}
              onChange={(e) => form.setField('name')(e.target.value || undefined)}
              placeholder={t('placeholders.name')}
              disabled={isPending}
              maxLength={MONITOR_LIMITS.NAME_MAX}
              className={cn(nameAtLimit && 'border-destructive', 'text-sm')}
            />
            <p className='text-muted-foreground text-xs'>{t('helper.nameDescription')}</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='monitor-url'>{t('fields.url')}</Label>
            <Input
              id='monitor-url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`https://${domain}/health`}
              className={cn((hasError || urlAtLimit) && 'border-destructive', 'text-sm')}
              disabled={isPending}
              required
              type='url'
              maxLength={MONITOR_LIMITS.URL_MAX}
            />
            {urlEmpty && <p className='text-destructive text-xs'>{t('errors.url')}</p>}
            {invalidProtocol && <p className='text-destructive text-xs'>{t('errors.invalidProtocol')}</p>}
            {urlInvalid && <p className='text-destructive text-xs'>{t('errors.urlDomain', { domain })}</p>}
            {hasCustomPort && <p className='text-destructive text-xs'>{t('errors.customPort')}</p>}
            {isDuplicate && <p className='text-destructive text-xs'>{t('errors.duplicate')}</p>}
          </div>

          <Separator />

          <div className='space-y-2'>
            <TimingSection
              form={form}
              isPending={isPending}
              open={expandedSection === 'timing'}
              onOpenChange={(isOpen) => setExpandedSection(isOpen ? 'timing' : null)}
            />

            <Separator />

            {session?.user.email && (
              <AlertsSection
                form={form}
                isPending={isPending}
                userEmail={session?.user.email}
                sslMonitoringEnabled={sslMonitoringEnabled}
                open={expandedSection === 'alerts'}
                onOpenChange={(isOpen) => setExpandedSection(isOpen ? 'alerts' : null)}
              />
            )}

            <Separator />

            <AdvancedSettingsSection
              form={form}
              isPending={isPending}
              isHttpSite={!isHttps}
              open={expandedSection === 'advanced'}
              onOpenChange={(isOpen) => setExpandedSection(isOpen ? 'advanced' : null)}
            />
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              className='cursor-pointer'
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button type='submit' disabled={isPending || hasError} className='min-w-[140px] cursor-pointer'>
              {isPending ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t('actions.creating')}
                </>
              ) : (
                t('actions.create')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

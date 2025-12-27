'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, Plus } from 'lucide-react';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { isUrlOnDomain } from '@/utils/domainValidation';
import { useMonitorForm } from './shared/hooks/useMonitorForm';
import { TimingSection, AlertsSection, AdvancedSettingsSection } from './shared/components';

type CreateMonitorDialogProps = {
  dashboardId: string;
  domain: string;
  existingUrls: string[];
};

type Section = 'timing' | 'alerts' | 'advanced' | null;

function getHostname(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function CreateMonitorDialog({ dashboardId, domain, existingUrls }: CreateMonitorDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(`https://${domain}`);
  const [expandedSection, setExpandedSection] = useState<Section>('timing');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations('monitoringPage.form');
  const { data: session } = useSession();

  const form = useMonitorForm({
    mode: 'create',
    ownerEmail: session?.user?.email,
  });

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

  // Check if this hostname is already monitored
  const newHostname = getHostname(url);
  const existingHostnames = new Set(existingUrls.map(getHostname).filter((h): h is string => h !== null));
  const isDuplicate = newHostname !== null && existingHostnames.has(newHostname);

  const hasError = urlEmpty || urlInvalid || isDuplicate;

  // SSL monitoring is enabled if URL is https
  const isHttps = url.trim().startsWith('https://');
  const sslMonitoringEnabled = isHttps && form.state.checkSslErrors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='default' className='cursor-pointer whitespace-nowrap'>
          {t('create')}
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
              className={cn(nameAtLimit && 'border-destructive')}
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
              className={cn((hasError || urlAtLimit) && 'border-destructive')}
              disabled={isPending}
              required
              type='url'
              maxLength={MONITOR_LIMITS.URL_MAX}
            />
            {urlEmpty && <p className='text-destructive text-xs'>{t('errors.url')}</p>}
            {urlInvalid && <p className='text-destructive text-xs'>{t('errors.urlDomain', { domain })}</p>}
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

            <AlertsSection
              form={form}
              isPending={isPending}
              userEmail={session?.user?.email}
              sslMonitoringEnabled={sslMonitoringEnabled}
              open={expandedSection === 'alerts'}
              onOpenChange={(isOpen) => setExpandedSection(isOpen ? 'alerts' : null)}
            />

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

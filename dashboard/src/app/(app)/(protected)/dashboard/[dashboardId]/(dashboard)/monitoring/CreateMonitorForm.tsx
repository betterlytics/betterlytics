'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { TimingSection, AlertsSection, AdvancedSettingsSection } from './shared/components';
import type { CreateMonitorController } from './shared/hooks/useCreateMonitor';

type CreateMonitorFormProps = {
  create: CreateMonitorController;
  domain: string;
  onCancel: () => void;
};

export function CreateMonitorForm({ create, domain, onCancel }: CreateMonitorFormProps) {
  const t = useTranslations('monitoringPage.form');
  const { data: session } = useSession();

  const {
    form,
    url,
    setUrl,
    expandedSection,
    setExpandedSection,
    isPending,
    nameAtLimit,
    urlAtLimit,
    urlEmpty,
    urlInvalid,
    hasCustomPort,
    isDuplicate,
    invalidProtocol,
    hasError,
    isHttps,
    sslMonitoringEnabled,
  } = create;

  return (
    <form onSubmit={create.submit} className='space-y-6 pt-2'>
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
          <>
            <AlertsSection
              form={form}
              isPending={isPending}
              userEmail={session?.user.email}
              sslMonitoringEnabled={sslMonitoringEnabled}
              open={expandedSection === 'alerts'}
              onOpenChange={(isOpen) => setExpandedSection(isOpen ? 'alerts' : null)}
            />

            <Separator />
          </>
        )}

        <AdvancedSettingsSection
          form={form}
          isPending={isPending}
          isHttpSite={!isHttps}
          open={expandedSection === 'advanced'}
          onOpenChange={(isOpen) => setExpandedSection(isOpen ? 'advanced' : null)}
        />
      </div>

      <div className='flex justify-end gap-2 pt-2'>
        <Button type='button' variant='outline' className='cursor-pointer' onClick={onCancel} disabled={isPending}>
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
  );
}

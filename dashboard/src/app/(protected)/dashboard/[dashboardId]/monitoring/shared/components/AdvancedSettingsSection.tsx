'use client';

import { ChevronDown, Plus, Settings, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingToggle } from '@/components/inputs/SettingToggle';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { getStatusCodeColorClasses } from '../utils/httpStatusColors';
import { SectionHeader } from './SectionHeader';
import type { MonitorFormInterface } from '../types';

export type AdvancedSettingsSectionProps = {
  form: MonitorFormInterface;
  isPending: boolean;
  isHttpSite: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export function AdvancedSettingsSection({
  form,
  isPending,
  isHttpSite,
  open,
  onOpenChange,
  defaultOpen = false,
}: AdvancedSettingsSectionProps) {
  const t = useTranslations('monitoringEditDialog');

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      defaultOpen={open === undefined ? defaultOpen : undefined}
      className='group/advanced'
    >
      <CollapsibleTrigger className='hover:bg-muted/50 -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center justify-between rounded-lg px-2 py-2 transition-colors'>
        <SectionHeader icon={Settings} title={t('sections.advanced')} />
        <ChevronDown className='text-muted-foreground h-4 w-4 transition-transform group-data-[state=open]/advanced:rotate-180' />
      </CollapsibleTrigger>

      <CollapsibleContent className='data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden'>
        <div className='space-y-6 pt-4'>
          <SettingToggle
            id='check-ssl-errors'
            label={t('advanced.sslMonitoring.label')}
            description={t('advanced.sslMonitoring.description')}
            checked={isHttpSite ? false : form.state.checkSslErrors}
            onCheckedChange={form.setField('checkSslErrors')}
            disabled={isPending || isHttpSite}
            disabledTooltip={isHttpSite ? t('advanced.sslMonitoring.httpDisabled') : undefined}
          />

          <Separator />

          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('advanced.httpMethod.label')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('advanced.httpMethod.description')}</p>
            </div>
            <Tabs
              value={form.state.httpMethod}
              onValueChange={(v) => form.setField('httpMethod')(v as 'HEAD' | 'GET')}
            >
              <TabsList className='h-8'>
                {(['HEAD', 'GET'] as const).map((method) => (
                  <TabsTrigger
                    key={method}
                    value={method}
                    disabled={isPending}
                    className='px-3 py-1 text-xs font-medium'
                  >
                    {method}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('advanced.requestHeaders.label')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>{t('advanced.requestHeaders.description')}</p>
            </div>
            <div className='space-y-2'>
              {form.state.requestHeaders.map((header, index) => {
                const isEmptyRow = header.key === '' && header.value === '';
                const isLastRow = index === form.state.requestHeaders.length - 1;
                const showDeleteButton = !isEmptyRow || !isLastRow;

                return (
                  <div key={index} className='flex items-center gap-2'>
                    <div className='border-input flex flex-1 overflow-hidden rounded-md border'>
                      <Input
                        placeholder={t('advanced.requestHeaders.namePlaceholder')}
                        value={header.key}
                        onChange={(e) => form.updateRequestHeader(index, 'key', e.target.value)}
                        disabled={isPending}
                        maxLength={MONITOR_LIMITS.REQUEST_HEADER_KEY_MAX}
                        className='h-9 flex-1 rounded-none border-0 text-sm focus-visible:z-10 focus-visible:ring-1'
                      />
                      <div className='bg-border w-px' />
                      <Input
                        placeholder={t('advanced.requestHeaders.valuePlaceholder')}
                        value={header.value}
                        onChange={(e) => form.updateRequestHeader(index, 'value', e.target.value)}
                        disabled={isPending}
                        maxLength={MONITOR_LIMITS.REQUEST_HEADER_VALUE_MAX}
                        className='h-9 flex-1 rounded-none border-0 text-sm focus-visible:ring-1'
                      />
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => form.removeRequestHeader(index)}
                      disabled={isPending || !showDeleteButton}
                      className={`h-9 w-9 flex-shrink-0 cursor-pointer ${
                        showDeleteButton
                          ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                          : 'invisible'
                      }`}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div>
              <Label className='text-sm font-medium'>{t('advanced.acceptedStatusCodes.label')}</Label>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {t('advanced.acceptedStatusCodes.description')}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-1.5'>
              {form.state.acceptedStatusCodes.map((code) => (
                <span
                  key={code}
                  className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 font-mono text-xs font-medium ${getStatusCodeColorClasses(code)}`}
                >
                  {code}
                  <button
                    type='button'
                    onClick={() => form.removeStatusCode(code)}
                    disabled={isPending}
                    className='cursor-pointer rounded p-0.5 opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </span>
              ))}
              <div className='flex items-center gap-1'>
                <Input
                  type='text'
                  placeholder='2xx'
                  value={form.state.statusCodeInput}
                  onChange={(e) => form.handleStatusCodeInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      form.addStatusCode();
                    }
                  }}
                  maxLength={3}
                  disabled={isPending}
                  className='h-7 w-16 font-mono text-xs'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={form.addStatusCode}
                  disabled={isPending || !form.state.statusCodeInput.trim()}
                  className='h-7 w-7 cursor-pointer'
                >
                  <Plus className='h-3.5 w-3.5' />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

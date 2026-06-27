'use client';

import { useState, useCallback } from 'react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getStatusCodeColorClasses } from '../utils/httpStatusColors';
import { isHeaderBlocked } from '../utils/formValidation';
import { SectionHeader } from './SectionHeader';
import { useCapabilities } from '@/contexts/CapabilitiesProvider';
import { CapabilityGate } from '@/components/billing/CapabilityGate';
import { ProBadge } from '@/components/billing/ProBadge';
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
  const [statusCodeInput, setStatusCodeInput] = useState('');
  const { caps } = useCapabilities();

  const handleStatusCodeInputChange = useCallback((value: string) => {
    setStatusCodeInput(value.replace(/[^0-9xX]/g, '').toLowerCase());
  }, []);

  const handleAddStatusCode = useCallback(() => {
    if (form.handleStatusCodeAdd(statusCodeInput)) {
      setStatusCodeInput('');
    }
  }, [form, statusCodeInput]);

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
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>{t('advanced.httpMethod.label')}</Label>
              {!caps.monitoring.httpMethodConfigurable && <ProBadge />}
            </div>
            <p className='text-muted-foreground text-xs'>{t('advanced.httpMethod.description')}</p>
            <CapabilityGate allowed={caps.monitoring.httpMethodConfigurable}>
              {({ locked }) => (
                <Tabs
                  value={form.state.httpMethod}
                  onValueChange={(v) => {
                    const method = v as 'HEAD' | 'GET';
                    if (locked && method !== 'HEAD') return;
                    form.setField('httpMethod')(method);
                  }}
                >
                  <TabsList className='h-8'>
                    <TabsTrigger value='HEAD' disabled={isPending} className='px-3 py-1 text-xs font-medium'>
                      HEAD
                    </TabsTrigger>
                    <TabsTrigger
                      value='GET'
                      disabled={isPending || locked}
                      className='px-3 py-1 text-xs font-medium'
                    >
                      GET
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </CapabilityGate>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>{t('advanced.expectedKeyword.label')}</Label>
              {!caps.monitoring.keywordValidation && <ProBadge />}
            </div>
            <CapabilityGate allowed={caps.monitoring.keywordValidation}>
              {({ locked }) => (
                <div className='space-y-1.5'>
                  <Input
                    type='text'
                    placeholder={t('advanced.expectedKeyword.placeholder')}
                    value={form.state.expectedKeyword ?? ''}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      if (locked && value !== null) return;
                      form.setField('expectedKeyword')(value);
                    }}
                    maxLength={MONITOR_LIMITS.EXPECTED_KEYWORD_MAX}
                    disabled={isPending || (locked && !form.state.expectedKeyword) || form.state.httpMethod !== 'GET'}
                    className='h-9 text-sm'
                  />
                  <p className='text-muted-foreground text-xs'>
                    {form.state.httpMethod !== 'GET'
                      ? t('advanced.expectedKeyword.requiresGet')
                      : t('advanced.expectedKeyword.description')}
                  </p>
                </div>
              )}
            </CapabilityGate>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>{t('advanced.requestHeaders.label')}</Label>
              {!caps.monitoring.customHeaders && <ProBadge />}
            </div>
            <p className='text-muted-foreground text-xs'>{t('advanced.requestHeaders.description')}</p>
            <CapabilityGate allowed={caps.monitoring.customHeaders}>
              {({ locked }) => (
                <div className='space-y-2'>
                  {(form.state.requestHeaders ?? []).map((header, index) => {
                    const isEmptyRow = header.key === '' && header.value === '';
                    const isLastRow = index === (form.state.requestHeaders ?? []).length - 1;
                    const showDeleteButton = !isEmptyRow || !isLastRow;
                    const headerBlocked = header.key.trim() !== '' && isHeaderBlocked(header.key);

                    return (
                      <div key={index} className='flex items-center gap-2'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              type='text'
                              placeholder={t('advanced.requestHeaders.namePlaceholder')}
                              value={header.key}
                              onChange={(e) => form.updateRequestHeader(index, 'key', e.target.value)}
                              maxLength={MONITOR_LIMITS.REQUEST_HEADER_KEY_MAX}
                              disabled={isPending || locked}
                              className={`h-9 flex-1 text-sm ${headerBlocked ? 'border-destructive text-destructive focus-visible:ring-destructive' : ''}`}
                            />
                          </TooltipTrigger>
                          {headerBlocked && (
                            <TooltipContent side='top'>
                              <p>{t('advanced.requestHeaders.blockedHeader')}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Input
                          type='text'
                          placeholder={t('advanced.requestHeaders.valuePlaceholder')}
                          value={header.value}
                          onChange={(e) => form.updateRequestHeader(index, 'value', e.target.value)}
                          maxLength={MONITOR_LIMITS.REQUEST_HEADER_VALUE_MAX}
                          disabled={isPending || locked}
                          className='h-9 flex-1 text-sm'
                        />
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => form.removeRequestHeader(index)}
                          disabled={isPending || locked || !showDeleteButton}
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
              )}
            </CapabilityGate>
          </div>

          <Separator />

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label className='text-sm font-medium'>{t('advanced.acceptedStatusCodes.label')}</Label>
              {!caps.monitoring.customStatusCodes && <ProBadge />}
            </div>
            <p className='text-muted-foreground text-xs'>{t('advanced.acceptedStatusCodes.description')}</p>
            <CapabilityGate allowed={caps.monitoring.customStatusCodes}>
              {({ locked }) => (
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
                        disabled={isPending || locked}
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
                      value={statusCodeInput}
                      onChange={(e) => handleStatusCodeInputChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStatusCode();
                        }
                      }}
                      maxLength={3}
                      disabled={isPending || locked}
                      className='h-7 w-16 font-mono text-xs'
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={handleAddStatusCode}
                      disabled={isPending || !statusCodeInput.trim() || locked}
                      className='h-7 w-7 cursor-pointer'
                    >
                      <Plus className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </div>
              )}
            </CapabilityGate>
          </div>

        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

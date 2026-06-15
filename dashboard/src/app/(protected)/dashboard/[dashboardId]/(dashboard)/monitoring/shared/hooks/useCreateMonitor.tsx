'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { CheckCircle2 } from 'lucide-react';
import { createMonitorCheckAction } from '@/app/actions/analytics/monitoring.actions';
import { MONITOR_LIMITS, type MonitorCheck } from '@/entities/analytics/monitoring.entities';
import { isUrlOnDomain, normalizeUrl } from '@/utils/domainValidation';
import { useMonitorForm } from './useMonitorForm';

type Section = 'timing' | 'alerts' | 'advanced' | null;

type UseCreateMonitorOptions = {
  dashboardId: string;
  domain: string;
  existingUrls: string[];
  /** Called with the created monitor after a successful submit. The caller decides what happens next (close, refresh, append, ...). */
  onCreated?: (monitor: MonitorCheck) => void;
};

export function useCreateMonitor({ dashboardId, domain, existingUrls, onCreated }: UseCreateMonitorOptions) {
  const t = useTranslations('monitoringPage.form');
  const form = useMonitorForm({ mode: 'create' });
  const [url, setUrl] = useState(`https://${domain}`);
  const [expandedSection, setExpandedSection] = useState<Section>('timing');
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setUrl(`https://${domain}`);
    setExpandedSection('timing');
    form.reset();
  };

  const nameAtLimit = (form.state.name?.length ?? 0) >= MONITOR_LIMITS.NAME_MAX;
  const urlAtLimit = url.length >= MONITOR_LIMITS.URL_MAX;

  const urlEmpty = !url.trim();
  const urlInvalid = !urlEmpty && !isUrlOnDomain(url, domain);

  const hasCustomPort = (() => {
    try {
      return new URL(url.trim()).port !== '';
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

  const submit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    startTransition(async () => {
      try {
        const payload = form.buildCreatePayload(url.trim());
        const created = await createMonitorCheckAction(dashboardId, payload);
        toast.success(t('success'), {
          icon: <CheckCircle2 className='h-4 w-4 text-emerald-500' />,
          description: t('successDescription'),
        });
        onCreated?.(created);
      } catch (error) {
        console.error(error);
        toast.error(t('error'));
      }
    });
  };

  return {
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
    submit,
    reset,
  };
}

export type CreateMonitorController = ReturnType<typeof useCreateMonitor>;

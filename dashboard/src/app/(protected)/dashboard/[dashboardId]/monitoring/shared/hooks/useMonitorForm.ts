'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import type { MonitorCheck, StatusCodeValue } from '@/entities/analytics/monitoring.entities';
import { MONITOR_LIMITS, MonitorCheckBaseSchema } from '@/entities/analytics/monitoring.entities';
import { MONITOR_INTERVAL_MARKS, REQUEST_TIMEOUT_MARKS, nearestIndex } from '../utils/sliderConstants';
import { validateStatusCode, validateAlertEmail, sortStatusCodes, deepEqual } from '../utils/formValidation';
import type { MonitorFormState, MonitorFormInterface, AlertConfig } from '../types';

type SchemaDefaults = z.infer<typeof MonitorCheckBaseSchema>;
const SCHEMA_DEFAULTS = MonitorCheckBaseSchema.parse({}) as SchemaDefaults;

function ensureEmptyHeaderRow(headers: { key: string; value: string }[]): { key: string; value: string }[] {
  return headers.some((h) => !h.key && !h.value) ? headers : [...headers, { key: '', value: '' }];
}

function toFormState(data: SchemaDefaults): MonitorFormState {
  return {
    intervalIdx: nearestIndex(MONITOR_INTERVAL_MARKS, data.intervalSeconds),
    timeoutIdx: nearestIndex(REQUEST_TIMEOUT_MARKS, data.timeoutMs),
    checkSslErrors: data.checkSslErrors,
    sslExpiryReminders: data.sslExpiryReminders,
    httpMethod: data.httpMethod,
    requestHeaders: ensureEmptyHeaderRow(data.requestHeaders ?? []),
    acceptedStatusCodes: data.acceptedStatusCodes,
    statusCodeInput: '',
    alerts: {
      enabled: data.alertsEnabled,
      emails: data.alertEmails,
      onDown: data.alertOnDown,
      onRecovery: data.alertOnRecovery,
      onSslExpiry: data.alertOnSslExpiry,
      sslExpiryDays: data.sslExpiryAlertDays,
      failureThreshold: data.failureThreshold,
    },
  };
}

const createDefaultState = (ownerEmail?: string | null): MonitorFormState =>
  toFormState({ ...SCHEMA_DEFAULTS, alertEmails: ownerEmail ? [ownerEmail] : [] });

const createStateFromMonitor = (m: MonitorCheck): MonitorFormState =>
  toFormState({
    ...m,
    requestHeaders: m.requestHeaders ?? [],
    acceptedStatusCodes: m.acceptedStatusCodes ?? ['2xx'],
    alertEmails: m.alertEmails ?? [],
  });

type CreateOptions = { mode: 'create'; ownerEmail?: string | null };
type EditOptions = { mode: 'edit'; monitor: MonitorCheck };
export type UseMonitorFormOptions = CreateOptions | EditOptions;

type CreatePayload = SchemaDefaults & { url: string };
type UpdatePayload = SchemaDefaults & { id: string };

export type MonitorFormResult = MonitorFormInterface & {
  isDirty: boolean;
  buildCreatePayload: (name: string | undefined, url: string) => CreatePayload;
  buildUpdatePayload: (id: string, name: string | null, isEnabled: boolean) => UpdatePayload;
  reset: () => void;
  markClean: () => void;
};

export function useMonitorForm(options: UseMonitorFormOptions): MonitorFormResult {
  const tStatusCodes = useTranslations('monitoringEditDialog.advanced.acceptedStatusCodes.validation');
  const tAlerts = useTranslations('monitoringEditDialog.alerts');

  const getInitialState = useCallback(
    () =>
      options.mode === 'edit' ? createStateFromMonitor(options.monitor) : createDefaultState(options.ownerEmail),
    [options.mode, options.mode === 'edit' ? options.monitor : options.ownerEmail],
  );

  const [state, setState] = useState<MonitorFormState>(getInitialState);
  const initialStateRef = useRef<MonitorFormState>(getInitialState());

  const intervalSeconds = MONITOR_INTERVAL_MARKS[state.intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[state.timeoutIdx];
  const isDirty = useMemo(() => !deepEqual(state, initialStateRef.current), [state]);

  const setField = useCallback(
    <K extends keyof MonitorFormState>(field: K) =>
      (value: MonitorFormState[K]) =>
        setState((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const updateAlert = useCallback(<K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) => {
    setState((prev) => ({ ...prev, alerts: { ...prev.alerts, [key]: value } }));
  }, []);

  const updateRequestHeader = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setState((prev) => {
      const updated = prev.requestHeaders.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      const isLast = index === prev.requestHeaders.length - 1;
      const hasContent = updated[index].key !== '' || updated[index].value !== '';
      if (isLast && hasContent && updated.length < MONITOR_LIMITS.REQUEST_HEADERS_MAX) {
        updated.push({ key: '', value: '' });
      }
      return { ...prev, requestHeaders: updated };
    });
  }, []);

  const removeRequestHeader = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      requestHeaders: ensureEmptyHeaderRow(prev.requestHeaders.filter((_, i) => i !== index)),
    }));
  }, []);

  const handleStatusCodeInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, statusCodeInput: value.replace(/[^0-9xX]/g, '').toLowerCase() }));
  }, []);

  const addStatusCode = useCallback(() => {
    const result = validateStatusCode(state.statusCodeInput, state.acceptedStatusCodes);
    if (!result.ok) {
      if (result.error === 'empty') return;
      const errorHandlers: Record<string, () => void> = {
        maxReached: () => toast.error(tStatusCodes('maxCodes', { max: MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX })),
        duplicate: () => {
          toast.error(tStatusCodes('alreadyAdded', { code: state.statusCodeInput }));
          setState((prev) => ({ ...prev, statusCodeInput: '' }));
        },
        invalidRange: () => toast.error(tStatusCodes('invalidRange')),
        invalidFormat: () => toast.error(tStatusCodes('invalidFormat')),
        outOfRange: () => toast.error(tStatusCodes('outOfRange')),
      };
      errorHandlers[result.error]?.();
      return;
    }
    setState((prev) => ({
      ...prev,
      acceptedStatusCodes: sortStatusCodes([...prev.acceptedStatusCodes, result.code]),
      statusCodeInput: '',
    }));
  }, [state.statusCodeInput, state.acceptedStatusCodes, tStatusCodes]);

  const removeStatusCode = useCallback((code: StatusCodeValue) => {
    setState((prev) => ({ ...prev, acceptedStatusCodes: prev.acceptedStatusCodes.filter((c) => c !== code) }));
  }, []);

  const tryAddAlertEmail = useCallback(
    (email: string): boolean => {
      const result = validateAlertEmail(email, state.alerts.emails);
      if (!result.ok) {
        if (result.error === 'maxReached')
          toast.error(tAlerts('maxEmails', { max: MONITOR_LIMITS.ALERT_EMAILS_MAX }));
        return false;
      }
      setState((prev) => ({ ...prev, alerts: { ...prev.alerts, emails: [...prev.alerts.emails, result.email] } }));
      return true;
    },
    [state.alerts.emails, tAlerts],
  );

  const removeAlertEmail = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      alerts: { ...prev.alerts, emails: prev.alerts.emails.filter((e) => e !== email) },
    }));
  }, []);

  const basePayload = useMemo(
    () => ({
      intervalSeconds,
      timeoutMs,
      checkSslErrors: state.checkSslErrors,
      sslExpiryReminders: state.sslExpiryReminders,
      httpMethod: state.httpMethod,
      requestHeaders: state.requestHeaders.filter((h) => h.key.trim() !== ''),
      acceptedStatusCodes: state.acceptedStatusCodes,
      alertsEnabled: state.alerts.enabled,
      alertEmails: state.alerts.emails,
      alertOnDown: state.alerts.onDown,
      alertOnRecovery: state.alerts.onRecovery,
      alertOnSslExpiry: state.alerts.onSslExpiry,
      sslExpiryAlertDays: state.alerts.sslExpiryDays,
      failureThreshold: state.alerts.failureThreshold,
    }),
    [state, intervalSeconds, timeoutMs],
  );

  const buildCreatePayload = useCallback(
    (name: string | undefined, url: string) => ({ ...basePayload, name, url, isEnabled: true as const }),
    [basePayload],
  );

  const buildUpdatePayload = useCallback(
    (id: string, name: string | null, isEnabled: boolean) => ({ ...basePayload, id, name, isEnabled }),
    [basePayload],
  );

  const reset = useCallback(() => {
    const initial = getInitialState();
    setState(initial);
    initialStateRef.current = initial;
  }, [getInitialState]);

  const markClean = useCallback(() => {
    initialStateRef.current = { ...state };
  }, [state]);

  return {
    state,
    isDirty,
    intervalSeconds,
    timeoutMs,
    setField,
    updateAlert,
    handleStatusCodeInputChange,
    addStatusCode,
    removeStatusCode,
    updateRequestHeader,
    removeRequestHeader,
    tryAddAlertEmail,
    removeAlertEmail,
    buildCreatePayload,
    buildUpdatePayload,
    reset,
    markClean,
  };
}

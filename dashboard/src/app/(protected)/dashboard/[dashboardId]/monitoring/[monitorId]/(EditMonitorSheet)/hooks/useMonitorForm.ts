'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type {
  MonitorCheck,
  HttpMethod,
  RequestHeader,
  StatusCodeValue,
} from '@/entities/analytics/monitoring.entities';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { MONITOR_INTERVAL_MARKS, REQUEST_TIMEOUT_MARKS, nearestIndex } from '../utils/sliderConstants';
import { validateStatusCode, validateAlertEmail, sortStatusCodes, deepEqual } from '../utils/formValidation';

type AlertConfig = {
  enabled: boolean;
  emails: string[];
  onDown: boolean;
  onRecovery: boolean;
  onSslExpiry: boolean;
  sslExpiryDays: number;
  failureThreshold: number;
};

type FormState = {
  intervalIdx: number;
  timeoutIdx: number;
  checkSslErrors: boolean;
  sslExpiryReminders: boolean;
  httpMethod: HttpMethod;
  requestHeaders: RequestHeader[];
  acceptedStatusCodes: StatusCodeValue[];
  statusCodeInput: string;
  alerts: AlertConfig;
};

function createInitialState(monitor: MonitorCheck): FormState {
  const existingHeaders = monitor.requestHeaders ?? [];
  const hasEmptyRow = existingHeaders.some((header) => header.key === '' && header.value === '');

  return {
    intervalIdx: nearestIndex(MONITOR_INTERVAL_MARKS, monitor.intervalSeconds),
    timeoutIdx: nearestIndex(REQUEST_TIMEOUT_MARKS, monitor.timeoutMs),
    checkSslErrors: monitor.checkSslErrors,
    sslExpiryReminders: monitor.sslExpiryReminders,
    httpMethod: monitor.httpMethod,
    requestHeaders: hasEmptyRow ? existingHeaders : [...existingHeaders, { key: '', value: '' }],
    acceptedStatusCodes: monitor.acceptedStatusCodes?.length ? monitor.acceptedStatusCodes : ['2xx'],
    statusCodeInput: '',
    alerts: {
      enabled: monitor.alertsEnabled,
      emails: monitor.alertEmails ?? [],
      onDown: monitor.alertOnDown,
      onRecovery: monitor.alertOnRecovery,
      onSslExpiry: monitor.alertOnSslExpiry,
      sslExpiryDays: monitor.sslExpiryAlertDays,
      failureThreshold: monitor.failureThreshold,
    },
  };
}

export function useMonitorForm(monitor: MonitorCheck, isOpen: boolean) {
  const tStatusCodes = useTranslations('monitoringEditDialog.advanced.acceptedStatusCodes.validation');
  const tAlerts = useTranslations('monitoringEditDialog.alerts');

  const [state, setState] = useState<FormState>(() => createInitialState(monitor));
  const initialStateRef = useRef<FormState>(createInitialState(monitor));

  const intervalSeconds = MONITOR_INTERVAL_MARKS[state.intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[state.timeoutIdx];
  const isDirty = useMemo(() => !deepEqual(state, initialStateRef.current), [state]);

  const setField = useCallback(
    <K extends keyof FormState>(field: K) =>
      (value: FormState[K]) =>
        setState((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const updateAlert = useCallback(<K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) => {
    setState((prev) => ({ ...prev, alerts: { ...prev.alerts, [key]: value } }));
  }, []);

  const updateRequestHeader = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setState((prev) => {
      const newHeaders = prev.requestHeaders.map((header, i) =>
        i === index ? { ...header, [field]: value } : header,
      );
      const isLastRow = index === prev.requestHeaders.length - 1;
      const rowHasContent = newHeaders[index].key !== '' || newHeaders[index].value !== '';
      if (isLastRow && rowHasContent && newHeaders.length < MONITOR_LIMITS.REQUEST_HEADERS_MAX) {
        newHeaders.push({ key: '', value: '' });
      }
      return { ...prev, requestHeaders: newHeaders };
    });
  }, []);

  const removeRequestHeader = useCallback((index: number) => {
    setState((prev) => {
      const newHeaders = prev.requestHeaders.filter((_, i) => i !== index);
      const hasEmptyRow = newHeaders.some((header) => header.key === '' && header.value === '');
      return { ...prev, requestHeaders: hasEmptyRow ? newHeaders : [...newHeaders, { key: '', value: '' }] };
    });
  }, []);

  const handleStatusCodeInputChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, statusCodeInput: value.replace(/[^0-9xX]/g, '').toLowerCase() }));
  }, []);

  const addStatusCode = useCallback(() => {
    const result = validateStatusCode(state.statusCodeInput, state.acceptedStatusCodes);
    if (!result.ok) {
      if (result.error === 'empty') return;
      const messages: Record<string, () => void> = {
        maxReached: () => toast.error(tStatusCodes('maxCodes', { max: MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX })),
        duplicate: () => {
          toast.error(tStatusCodes('alreadyAdded', { code: state.statusCodeInput }));
          setState((prev) => ({ ...prev, statusCodeInput: '' }));
        },
        invalidRange: () => toast.error(tStatusCodes('invalidRange')),
        invalidFormat: () => toast.error(tStatusCodes('invalidFormat')),
        outOfRange: () => toast.error(tStatusCodes('outOfRange')),
      };
      messages[result.error]?.();
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

  const buildUpdatePayload = useCallback(
    (monitorId: string, name: string | null, isEnabled: boolean) => ({
      id: monitorId,
      name,
      isEnabled,
      intervalSeconds,
      timeoutMs,
      checkSslErrors: state.checkSslErrors,
      sslExpiryReminders: state.sslExpiryReminders,
      httpMethod: state.httpMethod,
      requestHeaders: state.requestHeaders.filter((header) => header.key.trim() !== ''),
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

  const resetToCurrentState = useCallback(() => {
    initialStateRef.current = { ...state };
  }, [state]);

  return {
    state,
    isDirty,
    intervalSeconds,
    timeoutMs,
    setField,
    handleStatusCodeInputChange,
    addStatusCode,
    removeStatusCode,
    updateRequestHeader,
    removeRequestHeader,
    updateAlert,
    tryAddAlertEmail,
    removeAlertEmail,
    buildUpdatePayload,
    resetToCurrentState,
  };
}

'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  MonitorCheck,
  HttpMethod,
  RequestHeader,
  StatusCodeValue,
} from '@/entities/analytics/monitoring.entities';
import { MONITOR_INTERVAL_MARKS, REQUEST_TIMEOUT_MARKS, nearestIndex } from './sliderConstants';

type AlertConfig = {
  enabled: boolean;
  emails: string[];
  emailInput: string;
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
  const hasEmptyRow = existingHeaders.some((h) => h.key === '' && h.value === '');

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
      emailInput: '',
      onDown: monitor.alertOnDown,
      onRecovery: monitor.alertOnRecovery,
      onSslExpiry: monitor.alertOnSslExpiry,
      sslExpiryDays: monitor.sslExpiryAlertDays,
      failureThreshold: monitor.failureThreshold,
    },
  };
}

/** Compare two states for equality (ignoring transient input fields) */
function areStatesEqual(a: FormState, b: FormState): boolean {
  if (
    a.intervalIdx !== b.intervalIdx ||
    a.timeoutIdx !== b.timeoutIdx ||
    a.checkSslErrors !== b.checkSslErrors ||
    a.sslExpiryReminders !== b.sslExpiryReminders ||
    a.httpMethod !== b.httpMethod
  )
    return false;

  if (
    a.alerts.enabled !== b.alerts.enabled ||
    a.alerts.onDown !== b.alerts.onDown ||
    a.alerts.onRecovery !== b.alerts.onRecovery ||
    a.alerts.onSslExpiry !== b.alerts.onSslExpiry ||
    a.alerts.sslExpiryDays !== b.alerts.sslExpiryDays ||
    a.alerts.failureThreshold !== b.alerts.failureThreshold
  )
    return false;

  if (a.alerts.emails.length !== b.alerts.emails.length) return false;
  if (!a.alerts.emails.every((e, i) => e === b.alerts.emails[i])) return false;

  if (a.acceptedStatusCodes.length !== b.acceptedStatusCodes.length) return false;
  if (!a.acceptedStatusCodes.every((c, i) => c === b.acceptedStatusCodes[i])) return false;

  const aHeaders = a.requestHeaders.filter((h) => h.key.trim() !== '');
  const bHeaders = b.requestHeaders.filter((h) => h.key.trim() !== '');
  if (aHeaders.length !== bHeaders.length) return false;
  if (!aHeaders.every((h, i) => h.key === bHeaders[i].key && h.value === bHeaders[i].value)) return false;

  return true;
}

export function useMonitorForm(monitor: MonitorCheck, isOpen: boolean) {
  const [state, setState] = useState<FormState>(() => createInitialState(monitor));
  const initialStateRef = useRef<FormState>(createInitialState(monitor));
  // Track saved state to handle reopening before router.refresh() completes
  const lastSavedStateRef = useRef<FormState | null>(null);
  // Track monitor.id to detect when the monitor prop actually updates
  const lastMonitorIdRef = useRef<string>(monitor.id);

  // Reset state when dialog opens or monitor prop updates
  useEffect(() => {
    if (isOpen) {
      const monitorChanged = lastMonitorIdRef.current !== monitor.id;
      lastMonitorIdRef.current = monitor.id;

      // Prefer lastSavedState if we have one and monitor hasn't changed (stale prop scenario)
      // Otherwise use the monitor prop (fresh data from router.refresh or new monitor)
      let initial: FormState;
      if (lastSavedStateRef.current && !monitorChanged) {
        // We saved recently and monitor prop hasn't updated yet - use saved state
        initial = lastSavedStateRef.current;
      } else {
        // Fresh monitor prop or first open - use monitor data and clear saved state
        initial = createInitialState(monitor);
        lastSavedStateRef.current = null;
      }

      setState(initial);
      initialStateRef.current = initial;
    }
  }, [monitor, isOpen]);

  // Computed values
  const intervalSeconds = MONITOR_INTERVAL_MARKS[state.intervalIdx];
  const timeoutMs = REQUEST_TIMEOUT_MARKS[state.timeoutIdx];

  // Dirty state tracking
  const isDirty = useMemo(() => !areStatesEqual(state, initialStateRef.current), [state]);

  // State updaters
  const setIntervalIdx = (idx: number) => setState((s) => ({ ...s, intervalIdx: idx }));
  const setTimeoutIdx = (idx: number) => setState((s) => ({ ...s, timeoutIdx: idx }));
  const setCheckSslErrors = (v: boolean) => setState((s) => ({ ...s, checkSslErrors: v }));
  const setSslExpiryReminders = (v: boolean) => setState((s) => ({ ...s, sslExpiryReminders: v }));
  const setHttpMethod = (v: HttpMethod) => setState((s) => ({ ...s, httpMethod: v }));
  const setStatusCodeInput = (v: string) => setState((s) => ({ ...s, statusCodeInput: v }));

  // Alert updaters
  const updateAlert = <K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) =>
    setState((s) => ({ ...s, alerts: { ...s.alerts, [key]: value } }));

  // Header management
  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setState((s) => {
      const newHeaders = s.requestHeaders.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      const isLastRow = index === s.requestHeaders.length - 1;
      const rowHasContent = newHeaders[index].key !== '' || newHeaders[index].value !== '';
      if (isLastRow && rowHasContent) {
        newHeaders.push({ key: '', value: '' });
      }
      return { ...s, requestHeaders: newHeaders };
    });
  };

  const removeHeader = (index: number) => {
    setState((s) => {
      const newHeaders = s.requestHeaders.filter((_, i) => i !== index);
      const hasEmptyRow = newHeaders.some((h) => h.key === '' && h.value === '');
      return { ...s, requestHeaders: hasEmptyRow ? newHeaders : [...newHeaders, { key: '', value: '' }] };
    });
  };

  // Status code management
  const sortStatusCodes = (codes: StatusCodeValue[]): StatusCodeValue[] =>
    [...codes].sort((a, b) => {
      const aStr = String(a);
      const bStr = String(b);
      const aIsRange = aStr.includes('x');
      const bIsRange = bStr.includes('x');
      if (aIsRange && !bIsRange) return -1;
      if (!aIsRange && bIsRange) return 1;
      return aStr.localeCompare(bStr);
    });

  const handleStatusCodeInputChange = (value: string) => {
    const sanitized = value.replace(/[^0-9xX]/g, '').toLowerCase();
    setStatusCodeInput(sanitized);
  };

  const addStatusCode = () => {
    const input = state.statusCodeInput.trim().toLowerCase();
    if (!input) return;

    if (/^[2-5]xx$/.test(input)) {
      if (state.acceptedStatusCodes.includes(input)) {
        toast.error(`${input} is already added`);
      } else {
        setState((s) => ({ ...s, acceptedStatusCodes: sortStatusCodes([...s.acceptedStatusCodes, input]) }));
      }
      setStatusCodeInput('');
      return;
    }

    if (/^[0-9]xx$/.test(input)) {
      toast.error('Only ranges 2xx-5xx are valid HTTP status codes');
      return;
    }

    const code = parseInt(input, 10);
    if (isNaN(code)) {
      toast.error('Please enter a valid status code (e.g., 200) or range (e.g., 2xx)');
      return;
    }

    if (code < 100 || code > 599) {
      toast.error('Status code must be between 100 and 599');
      return;
    }

    if (state.acceptedStatusCodes.includes(code)) {
      toast.error(`${code} is already added`);
      setStatusCodeInput('');
      return;
    }

    setState((s) => ({ ...s, acceptedStatusCodes: sortStatusCodes([...s.acceptedStatusCodes, code]) }));
    setStatusCodeInput('');
  };

  const removeStatusCode = (code: StatusCodeValue) => {
    setState((s) => ({ ...s, acceptedStatusCodes: s.acceptedStatusCodes.filter((c) => c !== code) }));
  };

  const removeAlertEmail = (email: string) => {
    setState((s) => ({
      ...s,
      alerts: { ...s.alerts, emails: s.alerts.emails.filter((e) => e !== email) },
    }));
  };

  // Get data for save
  const getFormData = () => ({
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
  });

  // Alternative email add that returns success boolean (for EmailTokenInput)
  const tryAddAlertEmail = (email: string): boolean => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return false;
    }

    if (state.alerts.emails.includes(normalized)) {
      return false;
    }

    setState((s) => ({
      ...s,
      alerts: { ...s.alerts, emails: [...s.alerts.emails, normalized] },
    }));
    return true;
  };

  const resetToCurrentState = () => {
    const savedState = { ...state };
    initialStateRef.current = savedState;
    lastSavedStateRef.current = savedState;
  };

  return {
    state,
    isDirty,
    intervalSeconds,
    timeoutMs,
    setIntervalIdx,
    setTimeoutIdx,
    setCheckSslErrors,
    setSslExpiryReminders,
    setHttpMethod,
    setStatusCodeInput,
    handleStatusCodeInputChange,
    addStatusCode,
    removeStatusCode,
    updateHeader,
    removeHeader,
    updateAlert,
    tryAddAlertEmail,
    removeAlertEmail,
    getFormData,
    resetToCurrentState,
  };
}

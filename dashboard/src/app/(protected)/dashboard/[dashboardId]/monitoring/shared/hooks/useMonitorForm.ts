'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { MonitorCheck, StatusCodeValue } from '@/entities/analytics/monitoring.entities';
import {
  MONITOR_LIMITS,
  MonitorCheckBaseSchema,
  MonitorCheckCreate,
  MonitorCheckUpdate,
} from '@/entities/analytics/monitoring.entities';
import { validateStatusCode, validateAlertEmail, sortStatusCodes, deepEqual } from '../utils/formValidation';
import type { MonitorFormState, MonitorFormInterface } from '../types';

const SCHEMA_DEFAULTS = MonitorCheckBaseSchema.parse({});

function ensureEmptyHeaderRow(headers: { key: string; value: string }[]): { key: string; value: string }[] {
  return headers.some((h) => !h.key && !h.value) ? headers : [...headers, { key: '', value: '' }];
}

const createDefaultState = (ownerEmail?: string | null): MonitorFormState => ({
  ...SCHEMA_DEFAULTS,
  requestHeaders: ensureEmptyHeaderRow(SCHEMA_DEFAULTS.requestHeaders ?? []),
  alertEmails: ownerEmail ? [ownerEmail] : [],
});

const createStateFromMonitor = (m: MonitorCheck): MonitorFormState => ({
  ...m,
  requestHeaders: ensureEmptyHeaderRow(m.requestHeaders ?? []),
  acceptedStatusCodes: m.acceptedStatusCodes ?? ['2xx'],
  alertEmails: m.alertEmails ?? [],
});

type CreateOptions = { mode: 'create'; ownerEmail?: string | null };
type EditOptions = { mode: 'edit'; monitor: MonitorCheck };

export type MonitorFormResult = MonitorFormInterface & {
  isDirty: boolean;
  buildCreatePayload: (url: string) => MonitorCheckCreate;
  buildUpdatePayload: (id: string) => MonitorCheckUpdate;
  reset: () => void;
  markClean: () => void;
};

export function useMonitorForm(options: CreateOptions | EditOptions): MonitorFormResult {
  const tStatusCodes = useTranslations('monitoringEditDialog.advanced.acceptedStatusCodes.validation');
  const tAlerts = useTranslations('monitoringEditDialog.alerts');

  const getInitialState = useCallback(
    () =>
      options.mode === 'edit' ? createStateFromMonitor(options.monitor) : createDefaultState(options.ownerEmail),
    [options.mode, options.mode === 'edit' ? options.monitor : options.ownerEmail],
  );

  const [state, setState] = useState<MonitorFormState>(getInitialState);
  const initialStateRef = useRef<MonitorFormState>(getInitialState());

  const isDirty = useMemo(() => !deepEqual(state, initialStateRef.current), [state]);

  const setField = useCallback(
    <K extends keyof MonitorFormState>(field: K) =>
      (value: MonitorFormState[K]) =>
        setState((prev) => ({ ...prev, [field]: value })),
    [],
  );

  const updateRequestHeader = useCallback((index: number, field: 'key' | 'value', value: string) => {
    setState((prev) => {
      const headers = prev.requestHeaders ?? [];
      const updated = headers.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      const isLast = index === headers.length - 1;
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
      requestHeaders: ensureEmptyHeaderRow((prev.requestHeaders ?? []).filter((_, i) => i !== index)),
    }));
  }, []);

  const handleStatusCodeAdd = useCallback(
    (input: string): boolean => {
      const result = validateStatusCode(input, state.acceptedStatusCodes);
      if (!result.ok) {
        if (result.error === 'empty') return false;
        const errorHandlers: Record<string, () => void> = {
          maxReached: () =>
            toast.error(tStatusCodes('maxCodes', { max: MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX })),
          duplicate: () => toast.error(tStatusCodes('alreadyAdded', { code: input })),
          invalidRange: () => toast.error(tStatusCodes('invalidRange')),
          invalidFormat: () => toast.error(tStatusCodes('invalidFormat')),
          outOfRange: () => toast.error(tStatusCodes('outOfRange')),
        };
        errorHandlers[result.error]?.();
        return false;
      }
      setState((prev) => ({
        ...prev,
        acceptedStatusCodes: sortStatusCodes([...prev.acceptedStatusCodes, result.code]),
      }));
      return true;
    },
    [state.acceptedStatusCodes, tStatusCodes],
  );

  const removeStatusCode = useCallback((code: StatusCodeValue) => {
    setState((prev) => ({ ...prev, acceptedStatusCodes: prev.acceptedStatusCodes.filter((c) => c !== code) }));
  }, []);

  const tryAddAlertEmail = useCallback(
    (email: string): boolean => {
      const result = validateAlertEmail(email, state.alertEmails);
      if (!result.ok) {
        if (result.error === 'maxReached')
          toast.error(tAlerts('maxEmails', { max: MONITOR_LIMITS.ALERT_EMAILS_MAX }));
        return false;
      }
      setState((prev) => ({ ...prev, alertEmails: [...prev.alertEmails, result.email] }));
      return true;
    },
    [state.alertEmails, tAlerts],
  );

  const removeAlertEmail = useCallback((email: string) => {
    setState((prev) => ({ ...prev, alertEmails: prev.alertEmails.filter((e) => e !== email) }));
  }, []);

  const buildCreatePayload = useCallback(
    (url: string): MonitorCheckCreate => ({
      ...state,
      url,
      requestHeaders: (state.requestHeaders ?? []).filter((h) => h.key.trim() !== ''),
    }),
    [state],
  );

  const buildUpdatePayload = useCallback(
    (id: string): MonitorCheckUpdate => ({
      ...state,
      id,
      requestHeaders: (state.requestHeaders ?? []).filter((h) => h.key.trim() !== ''),
    }),
    [state],
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
    setField,
    handleStatusCodeAdd,
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

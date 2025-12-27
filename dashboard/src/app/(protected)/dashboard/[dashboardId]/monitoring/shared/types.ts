'use client';

import type { HttpMethod, RequestHeader, StatusCodeValue } from '@/entities/analytics/monitoring.entities';

export type AlertConfig = {
  enabled: boolean;
  emails: string[];
  onDown: boolean;
  onRecovery: boolean;
  onSslExpiry: boolean;
  sslExpiryDays: number;
  failureThreshold: number;
};

export type MonitorFormState = {
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

export type MonitorFormInterface = {
  state: MonitorFormState;
  intervalSeconds: number;
  timeoutMs: number;
  setField: <K extends keyof MonitorFormState>(field: K) => (value: MonitorFormState[K]) => void;
  updateAlert: <K extends keyof AlertConfig>(key: K, value: AlertConfig[K]) => void;
  handleStatusCodeInputChange: (value: string) => void;
  addStatusCode: () => void;
  removeStatusCode: (code: StatusCodeValue) => void;
  updateRequestHeader: (index: number, field: 'key' | 'value', value: string) => void;
  removeRequestHeader: (index: number) => void;
  tryAddAlertEmail: (email: string) => boolean;
  removeAlertEmail: (email: string) => void;
};

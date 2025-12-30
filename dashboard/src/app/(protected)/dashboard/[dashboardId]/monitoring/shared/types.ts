'use client';

import { z } from 'zod';
import type { StatusCodeValue } from '@/entities/analytics/monitoring.entities';
import { MonitorCheckBaseSchema } from '@/entities/analytics/monitoring.entities';

export type MonitorFormState = z.infer<typeof MonitorCheckBaseSchema>;

export type MonitorFormInterface = {
  state: MonitorFormState;
  setField: <K extends keyof MonitorFormState>(field: K) => (value: MonitorFormState[K]) => void;
  handleStatusCodeAdd: (input: string) => boolean;
  removeStatusCode: (code: StatusCodeValue) => void;
  updateRequestHeader: (index: number, field: 'key' | 'value', value: string) => void;
  removeRequestHeader: (index: number) => void;
};

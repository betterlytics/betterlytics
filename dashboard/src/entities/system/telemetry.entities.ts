import { z } from 'zod';

export const TELEMETRY_INSTANCE_ROW_ID = 'instance';
// Keep in sync with backend/src/telemetry/mod.rs
export const TELEMETRY_VERSION_REGEX = /^v?\d{1,4}\.\d{1,4}\.\d{1,4}(-[0-9A-Za-z.-]{1,40})?$/;
export const TELEMETRY_MAX_VERSION_LENGTH = 48;

export const TelemetryInstanceSchema = z.object({
  instanceId: z.string().uuid(),
  lastSentAt: z.date().nullable(),
  createdAt: z.date(),
});

export type TelemetryInstance = z.infer<typeof TelemetryInstanceSchema>;

export type TelemetryPayload = { instance_id: string; version: string };

export type TelemetryDisabledReason = 'cloud' | 'dev_build' | 'do_not_track' | 'not_enabled' | 'invalid_version';

export type TelemetryPolicy = { enabled: true } | { enabled: false; reason: TelemetryDisabledReason };

export type TelemetryStatus = {
  policy: TelemetryPolicy;
  backgroundJobsEnabled: boolean;
  endpoint: string;
  payload: TelemetryPayload | null;
};

import { z } from 'zod';

export const WhatsNewVersionSchema = z
  .string()
  .regex(/^v\d+(?:\.\d+){0,2}$/i, 'Invalid Whats New version format. Use v{major}.{minor}.{patch}');

export type WhatsNewVersion = z.infer<typeof WhatsNewVersionSchema>;

export type WhatsNewMetadata = {
  version: WhatsNewVersion;
  releasedAt: string;
  title: string;
  summary: string;
};

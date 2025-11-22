import type { JSX } from 'react';
import TemplateEntry, { metadata as templateMetadata } from './2025-01-template';

export type WhatsNewEntry = {
  version: string;
  releasedAt: string;
  title: string;
  summary: string;
  Content: () => JSX.Element;
};

export const WHATS_NEW_ENTRIES: WhatsNewEntry[] = [
  {
    ...templateMetadata,
    Content: TemplateEntry,
  },
];

export const latestWhatsNewEntry = WHATS_NEW_ENTRIES[0];

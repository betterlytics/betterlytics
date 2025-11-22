import type { JSX } from 'react';
import type { WhatsNewMetadata, WhatsNewVersion } from '@/entities/whats-new';
import LatestWhatsNewContent, { metadata as latestMetadata } from './latest-modal';
import ReleaseV124Content, { metadata as releaseV124Metadata } from './v1-2-4';
import ReleaseV123Content, { metadata as releaseV123Metadata } from './v1-2-3';

export type WhatsNewEntry = WhatsNewMetadata & {
  Content: () => JSX.Element;
};

export const currentWhatsNewModalDisplay: WhatsNewEntry = {
  ...latestMetadata,
  Content: LatestWhatsNewContent,
};

const changelogEntries = [
  {
    ...releaseV124Metadata,
    Content: ReleaseV124Content,
  },
  {
    ...releaseV123Metadata,
    Content: ReleaseV123Content,
  },
] as const satisfies WhatsNewEntry[];

export const whatsNewEntries: readonly WhatsNewEntry[] = changelogEntries;

export function getWhatsNewEntry(version: WhatsNewVersion) {
  return changelogEntries.find((entry) => entry.version === version);
}

import type { JSX } from 'react';
import type { WhatsNewMetadata } from '@/entities/whats-new';
import LatestWhatsNewContent, { metadata as latestMetadata } from './latest-modal';

export type WhatsNewEntry = WhatsNewMetadata & {
  Content: () => JSX.Element;
};

export const latestWhatsNewEntry: WhatsNewEntry = {
  ...latestMetadata,
  Content: LatestWhatsNewContent,
};

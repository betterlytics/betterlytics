'use client';

import { latestWhatsNewEntry } from '@/content/whats-new';
import { WhatsNewDialog } from './WhatsNewDialog';

export function WhatsNewModal() {
  if (!latestWhatsNewEntry) {
    return null;
  }

  const { Content, ...metadata } = latestWhatsNewEntry;

  return (
    <WhatsNewDialog entry={metadata}>
      <Content />
    </WhatsNewDialog>
  );
}

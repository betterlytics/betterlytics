'use client';

import { ReplayTimeline } from '../ReplayTimeline';
import type { UsePlayerStateReturn } from '../hooks/usePlayerState';
import { useTranslations } from 'next-intl';

type ReplayTimelinePanelProps = {
  playerState: UsePlayerStateReturn;
  errorFingerprints?: string[];
};

export function ReplayTimelinePanel({ playerState, errorFingerprints }: ReplayTimelinePanelProps) {
  const t = useTranslations('components.sessionReplay.eventTimeline');

  return (
    <div className='min-h-0'>
      <ReplayTimeline
        markers={playerState.timelineMarkers}
        onJump={playerState.jumpTo}
        isSessionSelected={Boolean(playerState.durationMs)}
        errorFingerprints={errorFingerprints}
      />
      {playerState.isPrefetching && <p className='text-muted-foreground px-1 text-xs'>{t('prefetching')}</p>}
    </div>
  );
}

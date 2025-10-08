'use client';

import { ReplayTimeline } from '@/app/dashboard/[dashboardId]/replay/ReplayTimeline';
import type { UsePlayerStateReturn } from '../hooks/usePlayerState';
import { useTranslations } from 'next-intl';

type ReplayTimelinePanelProps = {
  playerState: UsePlayerStateReturn;
};

export function ReplayTimelinePanel({ playerState }: ReplayTimelinePanelProps) {
  const t = useTranslations('components.sessionReplay.eventTimeline');

  return (
    <div className='min-h-0'>
      <ReplayTimeline
        markers={playerState.timelineMarkers}
        onJump={playerState.jumpTo}
        isSessionSelected={Boolean(playerState.durationMs)}
      />
      {playerState.isPrefetching && <p className='text-muted-foreground px-1 text-xs'>{t('prefetching')}</p>}
    </div>
  );
}

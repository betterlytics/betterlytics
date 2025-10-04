'use client';

import { ReplayTimeline } from '@/app/dashboard/[dashboardId]/replay/ReplayTimeline';
import type { UsePlayerStateReturn } from '../hooks/usePlayerState';

type ReplayTimelinePanelProps = {
  playerState: UsePlayerStateReturn;
};

export function ReplayTimelinePanel({ playerState }: ReplayTimelinePanelProps) {
  return (
    <div className='min-h-0'>
      <ReplayTimeline
        markers={playerState.timelineMarkers}
        onJump={playerState.jumpTo}
        isSessionSelected={Boolean(playerState.durationMs)}
      />
      {playerState.isPrefetching && (
        <p className='text-muted-foreground px-1 text-xs'>Prefetching remaining segments…</p>
      )}
    </div>
  );
}

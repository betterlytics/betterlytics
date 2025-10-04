'use client';

import { ReplayPlayer } from '@/app/dashboard/[dashboardId]/replay/ReplayPlayer';
import { ReplayControls } from '@/app/dashboard/[dashboardId]/replay/ReplayControls';
import type { UsePlayerStateReturn } from '../hooks/usePlayerState';
import { useReplayPlayer } from '../hooks/useReplayPlayer';

type ReplayPlayerContainerProps = {
  playerState: UsePlayerStateReturn;
  error?: string | null;
};

export function ReplayPlayerContainer({ playerState, error }: ReplayPlayerContainerProps) {
  const { isPlaying, speed, setSkipInactivity, playPause, seekToRatio, setSpeed } = useReplayPlayer(playerState);

  return (
    <div className='bg-background rr-block relative flex h-full flex-col overflow-hidden rounded-lg border shadow-sm'>
      <ReplayPlayer ref={playerState.playerRef} playerState={playerState} />
      <ReplayControls
        isPlaying={isPlaying}
        currentTime={playerState.currentTime}
        durationMs={playerState.durationMs}
        speed={speed}
        onTogglePlay={playPause}
        isSkippingInactivity={playerState.isSkippingInactive}
        onSkipInactivityChange={setSkipInactivity}
        onSeekRatio={seekToRatio}
        onSpeedChange={setSpeed}
        markers={playerState.timelineMarkers}
        className='absolute inset-x-0 bottom-0'
      />
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
}

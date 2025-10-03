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
  const { isPlaying, speed, playPause, seekToRatio, setSpeed } = useReplayPlayer(playerState);

  return (
    <div className='bg-background rr-block relative flex min-h-0 flex-col overflow-hidden rounded-lg border shadow-sm lg:aspect-video'>
      <ReplayPlayer ref={playerState.playerRef} />
      <ReplayControls
        isPlaying={isPlaying}
        currentTime={playerState.currentTime}
        durationMs={playerState.durationMs}
        speed={speed}
        onTogglePlay={playPause}
        onSeekRatio={seekToRatio}
        onSpeedChange={setSpeed}
        markers={playerState.timelineMarkers}
        className='absolute inset-x-0 bottom-0'
      />
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
}

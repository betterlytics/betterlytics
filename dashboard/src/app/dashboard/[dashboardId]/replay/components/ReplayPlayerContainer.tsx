'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreenChange = useCallback(() => {
    const element = containerRef.current;
    setIsFullscreen(Boolean(element && document.fullscreenElement === element));
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

  const toggleFullscreen = useCallback(async () => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    try {
      if (document.fullscreenElement === element) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } else if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } catch (fullscreenError) {
      console.error('Failed to toggle fullscreen:', fullscreenError);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className='bg-background rr-block relative flex h-full flex-col overflow-hidden rounded-lg border shadow-sm'
    >
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
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        className='absolute inset-x-0 bottom-0'
      />
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
}

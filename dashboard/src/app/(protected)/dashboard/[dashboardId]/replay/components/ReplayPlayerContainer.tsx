'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ReplayPlayer } from '../ReplayPlayer';
import { ReplayControls } from '../ReplayControls';
import type { SessionReplay } from '@/entities/sessionReplays';
import type { UsePlayerStateReturn } from '../hooks/usePlayerState';
import { useReplayPlayer } from '../hooks/useReplayPlayer';
import { ReplayTopbar } from './ReplayTopbar';
import PausePlayIndicatorOverlay, { PausePlayIndicatorOverlayHandle } from './PausePlayIndicatorOverlay';

type ReplayPlayerContainerProps = {
  playerState: UsePlayerStateReturn;
  session?: SessionReplay | null;
  error?: string | null;
};

export function ReplayPlayerContainer({ playerState, session, error }: ReplayPlayerContainerProps) {
  const { isPlaying, speed, currentTime, setSkipInactivity, playPause, seekToRatio, setSpeed } = useReplayPlayer(
    playerState,
    session?.session_id,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const overlayRef = useRef<PausePlayIndicatorOverlayHandle | null>(null);

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

  const onPlayerClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      const willPlay = !isPlaying;
      overlayRef.current?.show(willPlay ? 'play' : 'pause');
      playPause();
    },
    [playPause, isPlaying],
  );

  return (
    <div
      className='bg-background flex h-full flex-col overflow-hidden rounded-lg border shadow-sm'
      ref={containerRef}
    >
      <ReplayTopbar session={session} />
      <div className='rr-block relative flex flex-1 flex-col overflow-hidden select-none' onClick={onPlayerClick}>
        <ReplayPlayer ref={playerState.playerRef} playerState={playerState} isPlaying={isPlaying} />
        <PausePlayIndicatorOverlay ref={overlayRef} />
      </div>
      <ReplayControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        durationMs={playerState.durationMs}
        speed={speed}
        onTogglePlay={playPause}
        isSkippingInactivity={playerState.isSkippingInactive}
        onSkipInactivityChange={setSkipInactivity}
        onSeekRatio={seekToRatio}
        onSpeedChange={setSpeed}
        markers={playerState.timelineMarkers}
        session={session}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      {error && <p className='text-sm text-red-500'>{error}</p>}
    </div>
  );
}

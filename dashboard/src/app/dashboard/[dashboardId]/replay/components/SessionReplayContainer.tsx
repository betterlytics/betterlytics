'use client';

import { useCallback, useEffect } from 'react';
import { useSessionManager } from '../hooks/useSessionManager';
import { usePlayerState } from '../hooks/usePlayerState';
import { useSegmentLoader } from '../hooks/useSegmentLoader';
import { ReplayPlayerContainer } from './ReplayPlayerContainer';
import { ReplaySessionPanel } from './ReplaySessionPanel';
import { ReplayTimelinePanel } from './ReplayTimelinePanel';

type SessionReplayContainerProps = {
  dashboardId: string;
};

export function SessionReplayContainer({ dashboardId }: SessionReplayContainerProps) {
  const sessionManager = useSessionManager(dashboardId);
  const segmentLoader = useSegmentLoader(dashboardId);
  const playerState = usePlayerState(dashboardId);

  useEffect(() => {
    const loadSelectedSession = async () => {
      if (!sessionManager.selectedSession) return;

      playerState.reset();

      try {
        const sessionWithSegments = await segmentLoader.loadSession(sessionManager.selectedSession);
        if (sessionWithSegments) {
          await playerState.loadSession(sessionWithSegments);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      }
    };

    loadSelectedSession();
  }, [sessionManager.selectedSession?.session_id]);

  const handleSelectSession = (session: NonNullable<typeof sessionManager.selectedSession>) => {
    sessionManager.selectSession(session);
  };

  const combinedError = sessionManager.error || segmentLoader.error || playerState.error;

  return (
    <div className='grid h-[calc(100svh-150px)] w-full gap-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]'>
      <ReplaySessionPanel sessionManager={sessionManager} onSelectSession={handleSelectSession} />
      <ReplayPlayerContainer playerState={playerState} error={combinedError} />
      <ReplayTimelinePanel playerState={playerState} />
    </div>
  );
}

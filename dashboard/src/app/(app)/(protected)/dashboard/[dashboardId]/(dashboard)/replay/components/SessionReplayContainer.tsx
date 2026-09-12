'use client';

import { useEffect } from 'react';
import { useSessionManager } from '../hooks/useSessionManager';
import { usePlayerState } from '../hooks/usePlayerState';
import { ReplayPlayerContainer } from './ReplayPlayerContainer';
import { ReplaySessionPanel } from './ReplaySessionPanel';
import { ReplayTimelinePanel } from './ReplayTimelinePanel';

type SessionReplayContainerProps = {
  dashboardId: string;
};

export function SessionReplayContainer({ dashboardId }: SessionReplayContainerProps) {
  const sessionManager = useSessionManager();
  const playerState = usePlayerState(dashboardId);

  useEffect(() => {
    if (!sessionManager.selectedSession) return;

    playerState.reset();
    playerState.loadSession(sessionManager.selectedSession).catch((error) => {
      console.error('Failed to load session:', error);
    });
  }, [sessionManager.selectedSession?.session_id]);

  const handleSelectSession = (session: NonNullable<typeof sessionManager.selectedSession>) => {
    sessionManager.selectSession(session);
  };

  const combinedError = sessionManager.error || playerState.error;

  return (
    <div className='grid h-[calc(100svh-150px)] w-full gap-3 lg:grid-cols-[260px_minmax(0,1fr)_280px]'>
      <ReplaySessionPanel sessionManager={sessionManager} onSelectSession={handleSelectSession} />
      <ReplayPlayerContainer
        playerState={playerState}
        session={sessionManager.selectedSession}
        error={combinedError}
      />
      <ReplayTimelinePanel playerState={playerState} />
    </div>
  );
}

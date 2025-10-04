'use client';

import { SessionReplayList } from '@/app/dashboard/[dashboardId]/replay/SessionReplayList';
import type { UseSessionManagerReturn } from '../hooks/useSessionManager';

type ReplaySessionPanelProps = {
  sessionManager: UseSessionManagerReturn;
  onSelectSession: (session: Parameters<UseSessionManagerReturn['selectSession']>[0]) => void;
};

export function ReplaySessionPanel({ sessionManager, onSelectSession }: ReplaySessionPanelProps) {
  return (
    <div className='min-h-0'>
      <SessionReplayList
        sessions={sessionManager.sessions}
        selectedSessionId={sessionManager.selectedSession?.session_id}
        onSelect={onSelectSession}
      />
    </div>
  );
}

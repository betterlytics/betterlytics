'use client';

import { SessionReplayContainer } from './components/SessionReplayContainer';

type Props = {
  dashboardId: string;
};

export default function ReplayClient({ dashboardId }: Props) {
  return <SessionReplayContainer dashboardId={dashboardId} />;
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';

type Props = {
  dashboardId: string;
  initialSiteId?: string;
  initialSessionId?: string;
  backendOrigin: string;
};

type PresignGetResponse = { url: string; key: string };

export default function ReplayClient({ dashboardId, initialSiteId, initialSessionId, backendOrigin }: Props) {
  const [siteId, setSiteId] = useState<string>(initialSiteId ?? '');
  const [sessionId, setSessionId] = useState<string>(initialSessionId ?? '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [segments, setSegments] = useState<string[]>([]);
  const playerRef = useRef<HTMLDivElement | null>(null);

  // Fetch segments sequentially until the first missing one, to avoid spamming requests
  const fetchAllSegments = useCallback(async (): Promise<{ urls: string[]; events: any[] }> => {
    const urls: string[] = [];
    const allEvents: any[] = [];
    const maxSegments = 500;
    for (let i = 0; i < maxSegments; i += 1) {
      const key = `site/${siteId}/sess/${sessionId}/${String(i).padStart(6, '0')}.json`;
      try {
        const presign = await fetch(`${backendOrigin}/replay/presign/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, ttl_secs: 60 }),
        });
        if (!presign.ok) {
          break;
        }
        const data = (await presign.json()) as PresignGetResponse;
        const segResp = await fetch(data.url);
        if (!segResp.ok) {
          // Stop on first missing segment after at least one success
          break;
        }
        const seg = (await segResp.json()) as any[];
        if (!Array.isArray(seg) || seg.length === 0) {
          // Empty segment, stop
          break;
        }
        urls.push(data.url);
        allEvents.push(...seg);
      } catch {
        break;
      }
    }
    return { urls, events: allEvents };
  }, [backendOrigin, sessionId, siteId]);

  const startPlayback = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { urls, events } = await fetchAllSegments();
      if (urls.length === 0 || events.length === 0) {
        setError('No segments found for this session');
        setLoading(false);
        return;
      }

      setSegments(urls);

      // Clear previous player
      if (playerRef.current) {
        playerRef.current.innerHTML = '';
      }

      if (!playerRef.current) {
        setError('Player container not available');
        setLoading(false);
        return;
      }

      const player = new rrwebPlayer({
        target: playerRef.current,
        props: { events },
      });
      // rrweb-player auto-renders and provides controls; no manual play call required
    } catch (e: any) {
      setError(e?.message ?? 'Failed to start playback');
    } finally {
      setLoading(false);
    }
  }, [fetchAllSegments]);

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 items-end gap-3 md:grid-cols-4'>
        <div>
          <label className='mb-1 block text-sm font-medium'>Site ID</label>
          <input
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            placeholder='test-xxxxx'
            className='w-full rounded border px-3 py-2'
          />
        </div>
        <div className='md:col-span-2'>
          <label className='mb-1 block text-sm font-medium'>Session ID</label>
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder='abcdef...'
            className='w-full rounded border px-3 py-2'
          />
        </div>
        <div>
          <button
            onClick={startPlayback}
            disabled={loading || !siteId || !sessionId}
            className='inline-flex items-center justify-center rounded bg-black px-4 py-2 text-white disabled:opacity-50'
          >
            {loading ? 'Loading…' : 'Play'}
          </button>
        </div>
      </div>

      {error && <p className='text-sm text-red-600'>{error}</p>}

      <div className='overflow-hidden rounded border'>
        <div ref={playerRef} className='h-[480px] w-full bg-white' />
      </div>

      {segments.length > 0 && <div className='text-xs text-gray-500'>Loaded {segments.length} segment(s).</div>}
    </div>
  );
}

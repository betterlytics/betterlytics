'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { EventType, type eventWithTime } from '@rrweb/types';
import { useResizeObserver } from '@/hooks/use-resize-observer';
import { UsePlayerStateReturn } from './hooks/usePlayerState';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export type ReplayPlayerHandle = {
  loadInitialEvents: (events: eventWithTime[]) => void;
  appendEvents: (events: eventWithTime[]) => void;
  seekTo: (timeOffset: number) => void;
  getCurrentTime: () => number | undefined;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
  toggleSkipInactive?: () => void;
  addEventListener: <K extends PlayerEventName>(
    type: K,
    listener: (e: CustomEvent<{ payload: PlayerEventDetailMap[K] }>) => void,
  ) => void;
  removeEventListener: <K extends PlayerEventName>(
    type: K,
    listener: (e: CustomEvent<{ payload: PlayerEventDetailMap[K] }>) => void,
  ) => void;
  handleEvent: (event: eventWithTime) => void;
};

type ReplayPlayerProps = {
  onReady?: () => void;
  playerState: UsePlayerStateReturn;
  skipInactive?: boolean;
  isPlaying?: boolean;
};

type PlayerEventName = 'ui-update-current-time' | 'ui-update-player-state' | 'ui-update-progress' | 'event-cast';
type PlayerEventDetailMap = {
  'ui-update-current-time': number;
  'ui-update-player-state': 'playing' | 'paused';
  'ui-update-progress': number;
  'event-cast': eventWithTime;
};

type PlayerEventTarget = {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

const ReplayPlayerComponent = (
  { onReady, playerState, isPlaying }: ReplayPlayerProps,
  ref: React.ForwardedRef<ReplayPlayerHandle>,
) => {
  const t = useTranslations('components.sessionReplay.player');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<rrwebPlayer | null>(null);
  const listenersRef = useRef<{ type: PlayerEventName; listener: EventListener }[]>([]);
  const redactedRef = useRef<boolean>(false);
  const redactedContainerRef = useRef<HTMLDivElement | null>(null);
  const speedRef = useRef<number>(1);
  const skipInactivityRef = useRef<boolean>(playerState.isSkippingInactive);
  const isSkippingInactivityRef = useRef<boolean>(false);

  const findClosestEventBefore = useCallback(
    (timeOffset: number, eventType?: number) => {
      const events = playerState.eventsRef.current;
      if (events.length === 0) {
        return null;
      }

      const targetAbsoluteTime = (events[0]?.timestamp ?? 0) + timeOffset;

      const filteredEvents = events.filter(
        (e) => (eventType === undefined ? true : e.type === eventType) && e.timestamp <= targetAbsoluteTime,
      );

      if (filteredEvents.length === 0) {
        return null;
      }

      let closestEvent = filteredEvents[0];

      for (const event of filteredEvents) {
        if (event.timestamp <= targetAbsoluteTime && event.timestamp > closestEvent.timestamp) {
          closestEvent = event;
        }
      }

      return closestEvent;
    },
    [playerState.eventsRef],
  );

  const findClosestEventBeforeTimestamp = useCallback(
    (timeOffset: number, eventType?: number) => {
      const events = playerState.eventsRef.current;
      if (events.length === 0) {
        return null;
      }

      const originTimestamp = events[0]?.timestamp ?? 0;

      return findClosestEventBefore(timeOffset, eventType)!.timestamp - originTimestamp;
    },
    [findClosestEventBefore, playerState.eventsRef],
  );

  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {}

      try {
        const target = playerRef.current as unknown as PlayerEventTarget;
        listenersRef.current.forEach(({ type, listener }) => target.removeEventListener(type, listener));
      } catch {}

      const maybeDestroy = playerRef.current as unknown as { destroy?: () => void };
      maybeDestroy.destroy?.();
      playerRef.current = null;
    }

    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
  }, []);

  const size = useDebounce(useResizeObserver(containerRef), 200);

  const recreatePlayer = useCallback(
    (events: eventWithTime[], autoPlay?: boolean) => {
      if (!containerRef.current || events.length === 0) {
        return;
      }

      destroyPlayer();

      playerRef.current = new rrwebPlayer({
        target: containerRef.current,
        props: {
          events,
          autoPlay: autoPlay ?? false,
          showController: false,
          speedOption: [1, 2, 4, 8],
          skipInactive: playerState.isSkippingInactive,
          width: size.width,
          height: size.height,
        },
      });

      // Attach any previously registered listeners to the new player instance
      const target = playerRef.current as unknown as PlayerEventTarget;
      listenersRef.current.forEach(({ type, listener }) => target.addEventListener(type, listener));

      onReady?.();
    },
    [destroyPlayer, size, onReady],
  );

  const redactBlacklisted = useCallback(() => {
    if (redactedRef.current === false && containerRef.current) {
      containerRef.current.style = `filter: blur(10px) !important;`;
      redactedRef.current = true;
      if (redactedContainerRef.current) {
        redactedContainerRef.current.style = 'visibility: visible;';
      }
    }
  }, []);

  const unredactBlacklisted = useCallback(() => {
    if (redactedRef.current === true && containerRef.current) {
      containerRef.current.style = '';
      redactedRef.current = false;
      if (redactedContainerRef.current) {
        redactedContainerRef.current.style = 'visibility: hidden;';
      }
    }
  }, []);

  const handleEvent = useCallback(
    (event: eventWithTime) => {
      if (event.type === EventType.Custom && event.data.tag === 'Blacklist') {
        redactBlacklisted();
      } else if (event.type === EventType.Custom && event.data.tag === 'Pageview') {
        unredactBlacklisted();
      }
    },
    [redactBlacklisted, unredactBlacklisted],
  );

  const seekTo = useCallback(
    (timeOffset: number) => {
      if (!playerRef.current) {
        return;
      }
      const closestEventBefore = findClosestEventBefore(timeOffset);

      try {
        playerRef.current.goto(timeOffset);

        if (closestEventBefore) {
          handleEvent(closestEventBefore);
        }

        return;
      } catch (error) {
        const fallbackEventType = 2;
        console.warn(`Direct seek failed, using type ${fallbackEventType} fallback strategy:`, error);
        recreatePlayer(playerState.eventsRef.current, isPlaying);

        const closestFullPaintBefore = findClosestEventBeforeTimestamp(timeOffset, fallbackEventType);
        if (closestFullPaintBefore === null) {
          return;
        }

        try {
          playerRef.current?.goto(closestFullPaintBefore);

          try {
            playerRef.current?.goto(timeOffset);
            if (closestEventBefore) {
              handleEvent(closestEventBefore);
            }
            return;
          } catch (retryError) {
            console.warn(
              `Could not seek to exact time after type ${fallbackEventType}, staying at type ${fallbackEventType} event`,
            );
          }
        } catch (typeError) {
          console.warn(`Failed to seek to type ${fallbackEventType} event:`, typeError);
        }
        toast.warning('Something went wrong, starting from nearest snapshot', {
          position: 'bottom-right',
          richColors: true,
          duration: 2000,
        });
        recreatePlayer(playerState.eventsRef.current, isPlaying);
        playerRef.current?.goto(closestFullPaintBefore);
      }
    },
    [recreatePlayer, playerRef, findClosestEventBefore, findClosestEventBeforeTimestamp, handleEvent],
  );

  const getCurrentTime = useCallback(() => {
    if (!playerRef.current) {
      return undefined;
    }
    const replayer = playerRef.current.getReplayer();
    return typeof replayer.getCurrentTime === 'function' ? replayer.getCurrentTime() : undefined;
  }, []);

  useImperativeHandle(ref, () => ({
    loadInitialEvents(events) {
      if (!containerRef.current) {
        throw new Error('Replay container not mounted');
      }

      if (events.length === 0) {
        return;
      }

      recreatePlayer(events);
    },
    appendEvents(events) {
      if (!playerRef.current || events.length === 0) {
        return;
      }
      // Use try/catch to avoid noisy console errors if player was disposed mid-loop
      try {
        events.forEach((event) => playerRef.current?.addEvent(event));
      } catch (_err) {}
    },
    seekTo(timeOffset) {
      return seekTo(timeOffset);
    },
    getCurrentTime() {
      return getCurrentTime();
    },
    play() {
      playerRef.current?.play();
    },
    pause() {
      playerRef.current?.pause();
    },
    setSpeed(speed: number) {
      speedRef.current = speed;
      playerRef.current?.setSpeed(speed);
    },
    reset() {
      destroyPlayer();
    },
    toggleSkipInactive() {
      skipInactivityRef.current = !skipInactivityRef.current;

      if (skipInactivityRef.current) {
        const currentTime = getCurrentTime();
        recreatePlayer(playerState.eventsRef.current, isPlaying);
        seekTo(currentTime ?? 0);
      }
    },
    addEventListener(type, listener) {
      const target = playerRef.current;
      const wrapped = listener as unknown as EventListener;
      listenersRef.current.push({ type, listener: wrapped });
      if (target) {
        (target as unknown as PlayerEventTarget).addEventListener(type, wrapped);
      }
    },
    removeEventListener(type, listener) {
      const target = playerRef.current as unknown as PlayerEventTarget | null;
      const wrapped = listener as unknown as EventListener;
      if (target) {
        target.removeEventListener(type, wrapped);
      }

      listenersRef.current = listenersRef.current.filter((l) => !(l.type === type && l.listener === wrapped));
    },
    handleEvent(event: eventWithTime) {
      if (event.type === EventType.Custom && event.data.tag === 'Blacklist') {
        redactBlacklisted();
      } else {
        unredactBlacklisted();
      }
    },
  }));

  useEffect(() => {
    const previousTime = (() => {
      const existing = playerRef.current;
      if (!existing) return undefined;
      const replayer = existing.getReplayer();
      return typeof replayer.getCurrentTime === 'function' ? replayer.getCurrentTime() : undefined;
    })();

    recreatePlayer(playerState.eventsRef.current, isPlaying);

    if (typeof previousTime === 'number') {
      try {
        seekTo(previousTime);
      } catch {}
    }

    playerRef.current?.triggerResize();
  }, [size, playerState.eventsRef, playerRef, seekTo]);

  useEffect(() => {
    return () => {
      destroyPlayer();
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className='flex h-full w-full items-center justify-center dark:[&_.rr-player]:!bg-black'
      />
      <div
        className='absolute flex h-full w-full items-center justify-center pb-20'
        style={{
          visibility: 'hidden',
        }}
        ref={redactedContainerRef}
      >
        <span className='bg-background rounded-md border-2 px-6 py-3 text-lg shadow'>
          {t('recordingDisabled')}
        </span>
      </div>
    </>
  );
};

export const ReplayPlayer = forwardRef(ReplayPlayerComponent);

ReplayPlayer.displayName = 'ReplayPlayer';

export default ReplayPlayer;

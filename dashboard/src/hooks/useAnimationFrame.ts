import { useEffect, useRef, useCallback } from 'react';

type AnimationFrameCallback = (time: number, deltaTime: number) => void;

export function useAnimationFrame(callback: AnimationFrameCallback) {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loop = useCallback((time: number) => {
    const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 0;
    lastTimeRef.current = time;
    callbackRef.current(time, deltaTime);
    frameRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [loop]);
}

import { useState, useEffect } from 'react';

type UseCountdownOptions = {
  initialValue: number;
  isRunning: boolean;
  step?: number;
  intervalMs?: number;
};

/**
 * Custom hook to manage a countdown timer.
 *
 * @param options.initialValue The starting value for the countdown (e.g., 5 seconds).
 * @param options.isRunning Starts the countdown when true; toggling from false -> true restarts it.
 * @param options.step Defines how much the countdown value decrements pr. tick. (Default = 1)
 * @param options.intervalMs Defines how many milliseconds between each tick. (Default = 1000ms)
 *
 * @returns An object containing the current countdown value and a boolean indicating if it has finished.
 */
export function useCountdown(options: UseCountdownOptions) {
  const { initialValue, isRunning, step = 1, intervalMs = 1000 } = options;

  const [currentCount, setCurrentCount] = useState(initialValue);

  const isFinished = currentCount <= 0;

  useEffect(() => {
    setCurrentCount(initialValue);

    if (!isRunning) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentCount((prev) => {
        const nextCount = prev - step;

        if (nextCount <= 0) {
          clearInterval(timer);
          return 0;
        }

        return nextCount;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isRunning, initialValue, step, intervalMs]);

  return { countdown: currentCount, isFinished };
}

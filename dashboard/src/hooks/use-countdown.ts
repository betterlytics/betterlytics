import { useState, useEffect } from 'react';

/**
 * Custom hook to manage a countdown timer.
 *
 * @param initialValue The starting value for the countdown (e.g., 5 seconds).
 * @param isRunning If true, the countdown is active. Typically linked to a dialog's open state.
 * @returns An object containing the current countdown value and a boolean indicating if it has finished.
 */
export function useCountdown(initialValue: number, isRunning: boolean) {
  const [currentCount, setCurrentCount] = useState(initialValue);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isRunning) {
      setCurrentCount(initialValue);
      setIsFinished(false);

      const timer = setInterval(() => {
        setCurrentCount((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRunning, initialValue]);

  return { countdown: currentCount, isFinished };
}

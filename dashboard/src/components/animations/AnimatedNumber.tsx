'use client';

import { DigitReel } from '@/components/animations/DigitReel';
import { DIGIT_WIDTH, ENTER_EXIT_EASING, ENTER_SCALE, ENTER_TRANSFORM_OFFSET, MASK_HEIGHT, ZWSP, getMaskStyles } from '@/constants/animations';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useId, useMemo, useRef, useState, useLayoutEffect } from 'react';

type AnimatedNumberProps = {
  value: number;
  className?: string;
  duration?: number;
};

export type DigitLifecycle = 'idle' | 'entering' | 'exiting' | 'done';

type DigitState = {
  digit: number;
  prevDigit: number | null;
  positionFromRight: number;
  lifecycle: DigitLifecycle;
  id: string;
};

export function AnimatedNumber({
  value,
  className,
  duration = 1200,
}: AnimatedNumberProps) {
  const componentId = useId();
  const prevValueRef = useRef<number | null>(null);
  const digitMapRef = useRef<Map<number, DigitState>>(new Map());
  const digitIdCounter = useRef(0);

  const [digitStates, setDigitStates] = useState<DigitState[]>([]);
  
  // Single target value for this render cycle
  const activeDigitCount = digitStates.filter(d => d.lifecycle !== 'exiting' && d.lifecycle !== 'done').length || 1;
  const exitingDigitCount = digitStates.filter(d => d.lifecycle === 'exiting').length;
  const hasEnteringDigits = digitStates.some(d => d.lifecycle === 'entering');
  
  const slideDuration = Math.round(duration / Math.max(activeDigitCount + exitingDigitCount, 1));
  
  const generateDigitId = useCallback(() => {
    return `${componentId}-digit-${++digitIdCounter.current}`;
  }, [componentId]);

  const removeExitingDigit = useCallback((id: string) => {
    setDigitStates((prev) => prev.map(d => d.id === id ? { ...d, lifecycle: 'done' as const } : d));
  }, []);

  // Sync digit states when value changes
  useLayoutEffect(() => {
    const newDigits = String(Math.abs(Math.floor(value)))
      .split('')
      .map(Number);

    const oldDigits = prevValueRef.current !== null
      ? String(Math.abs(Math.floor(prevValueRef.current)))
          .split('')
          .map(Number)
      : null;

    const newStates: DigitState[] = [];
    const newDigitMap = new Map<number, DigitState>();
    const maxPosFromRight = Math.max(
      newDigits.length - 1,
      oldDigits ? oldDigits.length - 1 : 0
    );

    for (let posFromRight = maxPosFromRight; posFromRight >= 0; posFromRight--) {
      const newIndex = newDigits.length - 1 - posFromRight;
      const oldIndex = oldDigits ? oldDigits.length - 1 - posFromRight : -1;

      const hasNewDigit = newIndex >= 0 && newIndex < newDigits.length;
      const hasOldDigit = oldDigits && oldIndex >= 0 && oldIndex < oldDigits.length;

      const existingState = digitMapRef.current.get(posFromRight);

      if (hasNewDigit) {
        const id = existingState ? existingState.id : generateDigitId();
        const isNewlyEntering = !existingState && !hasOldDigit;
        
        const state: DigitState = {
          digit: newDigits[newIndex],
          prevDigit: hasOldDigit ? oldDigits[oldIndex] : (existingState?.digit ?? null),
          positionFromRight: posFromRight,
          lifecycle: isNewlyEntering ? 'entering' : 'idle',
          id,
        };
        newStates.push(state);
        newDigitMap.set(posFromRight, state);
      } else if (hasOldDigit && existingState) {
        newStates.push({
          ...existingState,
          digit: oldDigits[oldIndex],
          prevDigit: oldDigits[oldIndex],
          lifecycle: 'exiting',
        });
      }
    }

    digitMapRef.current = newDigitMap;
    setDigitStates(newStates);
    prevValueRef.current = value;
  }, [value, generateDigitId]);

  // Handle Lifecycle Transitions (Clearing Enter/Exit flags)
  useEffect(() => {
    const hasActivePhases = digitStates.some(d => d.lifecycle === 'entering' || d.lifecycle === 'exiting');
    if (!hasActivePhases) return;

    const timer = setTimeout(() => {
      setDigitStates(prev => prev
        .filter(d => d.lifecycle !== 'done')
        .map(d => {
          if (d.lifecycle === 'entering') return { ...d, lifecycle: 'idle' as const };
          if (d.lifecycle === 'exiting') return { ...d, lifecycle: 'done' as const };
          return d;
        })
      );
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [digitStates, slideDuration]);

  // Robust Stabilizer Heartbeat
  useEffect(() => {
    const timer = setTimeout(() => {
      if (prevValueRef.current === value) {
        setDigitStates(prev => prev
          .filter(d => d.lifecycle !== 'done')
          .map(s => ({ ...s, prevDigit: s.digit, lifecycle: 'idle' as const }))
        );
      }
    }, duration + 100); 
    return () => clearTimeout(timer);
  }, [value, duration]);

  // Reset Frame Logic (using layout version for absolute reliability)
  const [layoutVersion, setLayoutVersion] = useState(0);
  const lastActiveDigitCount = useRef(activeDigitCount);

  useLayoutEffect(() => {
    if (hasEnteringDigits && activeDigitCount > lastActiveDigitCount.current) {
      setLayoutVersion(v => v + 1);
      const rafId = requestAnimationFrame(() => setLayoutVersion(0));
      return () => cancelAnimationFrame(rafId);
    }
    lastActiveDigitCount.current = activeDigitCount;
  }, [hasEnteringDigits, activeDigitCount]);

  const maskStyles = useMemo(() => getMaskStyles(), []);

  const sectionStyle: React.CSSProperties = {
    transition: layoutVersion > 0 
      ? 'none' 
      : `width ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
    width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
    transform: layoutVersion > 0 
      ? `translate3d(calc(${ENTER_TRANSFORM_OFFSET} * ${DIGIT_WIDTH}), 0, 0) scale(${ENTER_SCALE}, 1)` 
      : 'none'
  };

  return (
    <span className={cn('inline-flex tabular-nums leading-none isolate whitespace-nowrap', className)}>
      <span 
        aria-label={value.toString()} 
        className="inline-flex ltr isolate relative -z-10"
      >
        <span 
          aria-hidden="true"
          className={`animated-number-pre inline-flex justify-end w-0 py-[calc(${MASK_HEIGHT}/2)]`}
        >
          <span className="inline-flex justify-inherit relative">{ZWSP}</span>
        </span>

        <span aria-hidden="true" style={maskStyles}>
          <span 
            style={sectionStyle}
            className="animated-number-integer inline-flex justify-end origin-left"
          >
            <span className="inline-flex justify-inherit relative">
              {ZWSP}
              {digitStates.filter(d => d.lifecycle !== 'done').map((state) => (
                <DigitReel
                  key={state.id}
                  digit={state.digit}
                  prevDigit={state.prevDigit}
                  duration={duration}
                  slideDuration={slideDuration}
                  lifecycle={state.lifecycle}
                />
              ))}
            </span>
          </span>

          <span className="animated-number-fraction inline-flex justify-start w-0">
            <span className="inline-flex justify-inherit relative">{ZWSP}</span>
          </span>
        </span>

        <span 
          aria-hidden="true"
          className={`animated-number-post inline-flex justify-start w-0 py-[calc(${MASK_HEIGHT}/2)]`}
        >
          <span className="inline-flex justify-inherit relative">{ZWSP}</span>
        </span>
      </span>
    </span>
  );
}

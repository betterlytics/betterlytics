'use client';

import { DigitReel } from '@/components/animations/DigitReel';
import { DIGIT_WIDTH, ENTER_EXIT_EASING, ENTER_SCALE, ENTER_TRANSFORM_OFFSET, MASK_HEIGHT, ZWSP, getMaskStyles } from '@/constants/animations';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  className?: string;
  duration?: number;
};

type DigitState = {
  digit: number;
  prevDigit: number | null;
  positionFromRight: number;
  isExiting?: boolean;
  isEntering?: boolean;
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
  const integerSectionRef = useRef<HTMLSpanElement>(null);
  const digitIdCounter = useRef(0);

  const [digitStates, setDigitStates] = useState<DigitState[]>([]);
  
  const activeDigitCount = digitStates.filter(d => !d.isExiting).length || 1;
  const exitingDigitCount = digitStates.filter(d => d.isExiting).length;
  const hasEnteringDigits = digitStates.some(d => d.isEntering);
  
  const slideDuration = Math.round(duration / Math.max(activeDigitCount + exitingDigitCount, 1));
  
  const generateDigitId = useCallback(() => {
    return `${componentId}-digit-${++digitIdCounter.current}`;
  }, [componentId]);

  const removeExitingDigit = useCallback((id: string) => {
    setDigitStates((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => {
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
          isExiting: false,
          isEntering: isNewlyEntering,
          id,
        };
        newStates.push(state);
        newDigitMap.set(posFromRight, state);
      } else if (hasOldDigit && existingState) {
        newStates.push({
          digit: oldDigits[oldIndex],
          prevDigit: oldDigits[oldIndex],
          positionFromRight: posFromRight,
          isExiting: true,
          isEntering: false,
          id: existingState.id,
        });
      }
    }

    digitMapRef.current = newDigitMap;
    setDigitStates(newStates);
    prevValueRef.current = value;
  }, [value, generateDigitId]);

  useEffect(() => {
    const section = integerSectionRef.current;
    if (!section) return;

    const isDigitCountChanging = hasEnteringDigits || exitingDigitCount;
    
    if (isDigitCountChanging) {
      if (hasEnteringDigits) {
        Object.assign(section.style, { 
          transition: 'none', 
          transform: `translate3d(calc(${ENTER_TRANSFORM_OFFSET} * ${DIGIT_WIDTH}), 0, 0) scale(${ENTER_SCALE}, 1)` 
        });
        void section.offsetHeight; // force reflow so initial styles are applied before animation
        Object.assign(section.style, { 
          transition: `width ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
          transform: 'none'
        });
      } else if (exitingDigitCount) {
        Object.assign(section.style, { 
          transition: `width ${slideDuration}ms ${ENTER_EXIT_EASING}`,
          width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`
        });
      }
      
      const postEnterCleanup = setTimeout(() => {
        if (section) {
          Object.assign(section.style, { transition: 'none', transform: 'none' });
        }
      }, slideDuration);
      
      return () => clearTimeout(postEnterCleanup);
    } else {
      Object.assign(section.style, { 
        transition: `width ${slideDuration}ms ${ENTER_EXIT_EASING}`,
        width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`
      });
    }
  }, [activeDigitCount, hasEnteringDigits, exitingDigitCount, slideDuration]);

  const maskStyles = useMemo(() => getMaskStyles(), []);

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
            ref={integerSectionRef}
            className="animated-number-integer inline-flex justify-end origin-left"
            style={{ width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})` }}
          >
            <span className="inline-flex justify-inherit relative">
              {ZWSP}
              {digitStates.map((state) => (
                <DigitReel
                  key={state.id}
                  digit={state.digit}
                  prevDigit={state.prevDigit}
                  duration={duration}
                  slideDuration={slideDuration}
                  isExiting={state.isExiting}
                  onExitComplete={() => removeExitingDigit(state.id)}
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

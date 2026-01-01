'use client';

import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import { DigitReel } from './DigitReel';
import { DIGIT_WIDTH, MASK_HEIGHT, ENTER_EXIT_EASING, ZWSP, getMaskStyles } from '@/constants/animations';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

interface DigitState {
  digit: number;
  prevDigit: number | null;
  positionFromRight: number;
  isExiting?: boolean;
  isEntering?: boolean;
  id: string;
}


export function AnimatedNumber({
  value,
  className,
  duration = 1200,
}: AnimatedNumberProps) {
  const componentId = useId();
  const prevValueRef = useRef<number | null>(null);
  const [digitStates, setDigitStates] = useState<DigitState[]>([]);
  const digitMapRef = useRef<Map<number, DigitState>>(new Map());
  const integerSectionRef = useRef<HTMLSpanElement>(null);
  const digitIdCounter = useRef(0);

  const generateDigitId = useCallback(() => {
    return `${componentId}-digit-${++digitIdCounter.current}`;
  }, [componentId]);

  const activeDigitCount = digitStates.filter(d => !d.isExiting).length || 1;
  const exitingDigitCount = digitStates.filter(d => d.isExiting).length;
  const hasExitingDigits = exitingDigitCount > 0;
  const hasEnteringDigits = digitStates.some(d => d.isEntering);

  const totalDigitCount = activeDigitCount + exitingDigitCount;
  const slideDuration = hasExitingDigits 
    ? Math.round(duration / Math.max(totalDigitCount, 1))
    : Math.round(duration / Math.max(activeDigitCount, 1));

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

    const isDigitCountChanging = hasEnteringDigits || hasExitingDigits;
    
    if (isDigitCountChanging) {
      if (hasEnteringDigits) {
        section.style.transition = 'none';
        section.style.transform = `translate3d(calc(-0.33 * ${DIGIT_WIDTH}), 0, 0) scale(1.02, 1)`;
        section.offsetHeight;
        section.style.transition = `width ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        section.style.width = `calc(${activeDigitCount} * ${DIGIT_WIDTH})`;
        section.style.transform = 'none';
      } else if (hasExitingDigits) {
        section.style.transition = `width ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        section.style.width = `calc(${activeDigitCount} * ${DIGIT_WIDTH})`;
      }
      
      const timer = setTimeout(() => {
        if (section) {
          section.style.transition = 'none';
          section.style.transform = 'none';
        }
      }, slideDuration);
      
      return () => clearTimeout(timer);
    } else {
      section.style.transition = `width ${slideDuration}ms ${ENTER_EXIT_EASING}`;
      section.style.width = `calc(${activeDigitCount} * ${DIGIT_WIDTH})`;
    }
  }, [activeDigitCount, hasEnteringDigits, hasExitingDigits, slideDuration]);

  const maskStyle = getMaskStyles();

  const integerSectionStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'right',
    width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
    transformOrigin: 'left center',
  };

  return (
    <span
      className={cn('inline-flex tabular-nums', className)}
      style={{ 
        lineHeight: 1,
        isolation: 'isolate',
        whiteSpace: 'nowrap',
      }}
    >
      <span 
        aria-label={value.toString()} 
        style={{ 
          display: 'inline-flex',
          direction: 'ltr',
          isolation: 'isolate', 
          position: 'relative', 
          zIndex: -1,
        }}
      >
        <span 
          aria-hidden="true"
          className="animated-number-pre"
          style={{
            padding: `calc(${MASK_HEIGHT} / 2) 0`,
            display: 'inline-flex',
            justifyContent: 'right',
            width: '0em',
          }}
        >
          <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
            {ZWSP}
          </span>
        </span>

        <span aria-hidden="true" style={maskStyle}>
          <span 
            ref={integerSectionRef}
            className="animated-number-integer"
            style={integerSectionStyle}
          >
            <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
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

          <span 
            className="animated-number-fraction"
            style={{
              display: 'inline-flex',
              justifyContent: 'left',
              width: '0em',
            }}
          >
            <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
              {ZWSP}
            </span>
          </span>
        </span>

        <span 
          aria-hidden="true"
          className="animated-number-post"
          style={{
            padding: `calc(${MASK_HEIGHT} / 2) 0`,
            display: 'inline-flex',
            justifyContent: 'left',
            width: '0em',
          }}
        >
          <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
            {ZWSP}
          </span>
        </span>
      </span>
    </span>
  );
}

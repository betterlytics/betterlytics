'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DigitReel } from './DigitReel';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  easing?: 'spring' | 'ease-out' | 'linear';
}

interface DigitState {
  digit: number;
  prevDigit: number | null;
  positionFromRight: number;
  isExiting?: boolean;
  isEntering?: boolean;
  id: string;
}

let instanceCounter = 0;
function generateId() {
  return `digit-${++instanceCounter}`;
}

// Zero-width space for maintaining proper inline-flex sizing
const ZWSP = '\u200B';
const ENTER_EXIT_EASING = 'ease-out';

export function AnimatedNumber({
  value,
  className,
  duration = 1200,
  easing = 'spring',
}: AnimatedNumberProps) {
  const prevValueRef = useRef<number | null>(null);
  const prevDigitCountRef = useRef<number>(0);
  const [digitStates, setDigitStates] = useState<DigitState[]>([]);
  const digitMapRef = useRef<Map<number, DigitState>>(new Map());
  const integerSectionRef = useRef<HTMLSpanElement>(null);

  const slideDuration = Math.round(duration / 3);

  const activeDigitCount = digitStates.filter(d => !d.isExiting).length;
  const hasExitingDigits = digitStates.some(d => d.isExiting);
  const hasEnteringDigits = digitStates.some(d => d.isEntering);

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
        const id = existingState ? existingState.id : generateId();
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
        const state: DigitState = {
          digit: oldDigits[oldIndex],
          prevDigit: oldDigits[oldIndex],
          positionFromRight: posFromRight,
          isExiting: true,
          isEntering: false,
          id: existingState.id,
        };
        newStates.push(state);
      }
    }

    prevDigitCountRef.current = oldDigits?.length ?? 0;
    digitMapRef.current = newDigitMap;
    setDigitStates(newStates);
    prevValueRef.current = value;
  }, [value]);

  // Animate the integer section: width AND X transform
  useEffect(() => {
    const section = integerSectionRef.current;
    if (!section) return;

    const isDigitCountChanging = hasEnteringDigits || hasExitingDigits;
    
    if (isDigitCountChanging) {
      if (hasEnteringDigits) {
        section.style.transition = 'none';
        section.style.transform = 'translate3d(calc(-0.33 * var(--digit-width, 0.65em)), 0, 0) scale(1.02, 1)';
        section.offsetHeight;
        section.style.transition = `width ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        section.style.width = `calc(${activeDigitCount} * var(--digit-width, 0.65em))`;
        section.style.transform = 'none';
      } else if (hasExitingDigits) {
        section.style.transition = `width ${slideDuration}ms ${ENTER_EXIT_EASING}, transform ${slideDuration}ms ${ENTER_EXIT_EASING}`;
        section.style.width = `calc(${activeDigitCount} * var(--digit-width, 0.65em))`;
        section.style.transform = 'translate3d(calc(-0.33 * var(--digit-width, 0.65em)), 0, 0) scale(0.98, 1)';
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
      section.style.width = `calc(${activeDigitCount} * var(--digit-width, 0.65em))`;
    }
  }, [activeDigitCount, hasEnteringDigits, hasExitingDigits, slideDuration]);

  const maskStyle: React.CSSProperties = {
    display: 'inline-flex',
    position: 'relative',
    zIndex: -1,
    overflow: 'clip',
    margin: '0 calc(-1 * var(--mask-width, 0.5em))',
    padding: 'calc(var(--mask-height, 0.3em) / 2) var(--mask-width, 0.5em)',
    maskImage: `
      linear-gradient(to right, transparent 0, #000 calc(var(--mask-width, 0.5em) / var(--invert-x, 1)), #000 calc(100% - calc(var(--mask-width, 0.5em) / var(--invert-x, 1))), transparent),
      linear-gradient(to bottom, transparent 0, #000 var(--mask-height, 0.3em), #000 calc(100% - var(--mask-height, 0.3em)), transparent 100%),
      radial-gradient(at bottom right, #000 0, transparent 71%),
      radial-gradient(at bottom left, #000 0, transparent 71%),
      radial-gradient(at top left, #000 0, transparent 71%),
      radial-gradient(at top right, #000 0, transparent 71%)
    `.replace(/\n\s*/g, ''),
    maskSize: `
      100% calc(100% - var(--mask-height, 0.3em) * 2),
      calc(100% - calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) * 2) 100%,
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.3em),
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.3em),
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.3em),
      calc(var(--mask-width, 0.5em) / var(--invert-x, 1)) var(--mask-height, 0.3em)
    `.replace(/\n\s*/g, ''),
    maskPosition: 'center center, center center, left top, right top, right bottom, left bottom',
    maskRepeat: 'no-repeat',
  } as React.CSSProperties;

  const integerSectionStyle: React.CSSProperties = {
    display: 'inline-flex',
    justifyContent: 'right',
    width: `calc(${activeDigitCount} * var(--digit-width, 0.65em))`,
    transformOrigin: 'left center',
  };

  return (
    <span
      className={cn('inline-flex tabular-nums', className)}
      style={{ 
        lineHeight: 1,
        isolation: 'isolate',
        whiteSpace: 'nowrap',
        ['--invert-x' as string]: 1,
        ['--mask-height' as string]: '0.3em',
        ['--mask-width' as string]: '0.5em',
        ['--digit-width' as string]: '0.65em',
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
          className="number-section-pre"
          style={{
            padding: 'calc(var(--mask-height, 0.3em) / 2) 0',
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
            className="number-section-integer"
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
                  easing={easing}
                  isExiting={state.isExiting}
                  onExitComplete={() => removeExitingDigit(state.id)}
                />
              ))}
            </span>
          </span>

          <span 
            className="number-section-fraction"
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
          className="number-section-post"
          style={{
            padding: 'calc(var(--mask-height, 0.3em) / 2) 0',
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

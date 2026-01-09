'use client';

import { DIGIT_WIDTH, MASK_HEIGHT, ZWSP, SPRING_EASING, getMaskStyles } from '@/constants/animated-number';
import React, { useMemo } from 'react';
import { DigitReelV2 } from './DigitReelV2';
import { AnimatedNumberProvider, useAnimatedNumber } from './context';

type AnimatedNumberV2Props = {
  value: number;
  duration?: number;
  /** Enable text selection overlay for copy/paste */
  withTextSelect?: boolean;
};

/**
 * AnimatedNumberV2 - Smooth rolling digit animation.
 */
function AnimatedNumberV2Component({ value, duration = 1200, withTextSelect = false }: AnimatedNumberV2Props) {
  const isNegative = value < 0;

  return (
    <AnimatedNumberProvider value={value} duration={duration}>
      <span
        style={{
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-flex',
          isolation: 'isolate',
          whiteSpace: 'nowrap',
        }}
      >
        {isNegative && <span>−</span>}
        <AnimatedNumberInner value={value} duration={duration} withTextSelect={withTextSelect} />
      </span>
    </AnimatedNumberProvider>
  );
}

/**
 * LayoutStabilizer - Keeps the container from collapsing during animations
 * by providing a zero-width space buffer in empty or transitioning sections.
 */
function LayoutStabilizer({ 
  element, 
  className, 
  justifyContent, 
  padding = 0 
}: { 
  element: string; 
  className: string; 
  justifyContent: 'flex-start' | 'flex-end'; 
  padding?: string | number;
}) {
  return (
    <span
      aria-hidden="true"
      data-element={element}
      className={className}
      style={{
        padding,
        display: 'inline-flex',
        justifyContent,
        width: 0,
      }}
    >
      <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
        {ZWSP}
      </span>
    </span>
  );
}

/**
 * Inner component that consumes context and renders digits.
 */
function AnimatedNumberInner({ value, duration, withTextSelect }: { value: number; duration: number; withTextSelect: boolean }) {
  const { state } = useAnimatedNumber();
  const maskStyles = useMemo(() => getMaskStyles(), []);
  
  const activeDigitCount = state.digits.filter(d => d.phase !== 'exiting').length;
  const displayValue = Math.abs(Math.floor(value));

  return (
    <span
      data-element="container"
      style={{
        display: 'inline-flex',
        direction: 'ltr',
        isolation: 'isolate',
        position: 'relative',
        contain: 'layout paint',
      }}
    >
      {/* Selectable overlay - only when withTextSelect enabled */}
      {withTextSelect && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            color: 'transparent',
            userSelect: 'text',
            zIndex: 1,
            lineHeight: 1,
            font: 'inherit',
          }}
        >
          {String(displayValue).split('').map((d, i) => (
            <span 
              key={i} 
              style={{ 
                display: 'inline-flex', 
                width: DIGIT_WIDTH, 
                justifyContent: 'center',
              }}
            >
              {d}
            </span>
          ))}
        </span>
      )}
      
      <LayoutStabilizer 
        element="pre-section" 
        className="number-section-pre" 
        justifyContent="flex-end" 
        padding={`calc(${MASK_HEIGHT}/2) 0`}
      />

      {/* Mask */}
      <span aria-hidden="true" data-element="mask" style={maskStyles}>
        {/* Integer section - width based on non-exiting digits */}
        <span
          data-element="integer-section"
          className="number-section-integer"
          style={{
            display: 'inline-flex',
            justifyContent: 'flex-end',
            width: `calc(${activeDigitCount} * ${DIGIT_WIDTH})`,
            transition: `width ${duration}ms ${SPRING_EASING}`,
          }}
        >
          <span style={{ display: 'inline-flex', justifyContent: 'inherit', position: 'relative' }}>
            {ZWSP}
            {state.digits.map((digitState) => (
              <DigitReelV2 key={digitState.id} digitState={digitState} />
            ))}
          </span>
        </span>

        <LayoutStabilizer 
          element="fraction-section" 
          className="number-section-fraction" 
          justifyContent="flex-start" 
        />
      </span>

      <LayoutStabilizer 
        element="post-section" 
        className="number-section-post" 
        justifyContent="flex-start" 
        padding={`calc(${MASK_HEIGHT}/2) 0`}
      />
    </span>
  );
}

export const AnimatedNumberV2 = React.memo(AnimatedNumberV2Component);
AnimatedNumberV2.displayName = 'AnimatedNumberV2';

'use client';

import { useState } from 'react';
import { AnimatedNumber } from '@/components/animations/AnimatedNumber';
import { AnimatedNumberV2 } from '@/components/animations/v2';

export default function TestAnimationPage() {
  const [v1Value, setV1Value] = useState(5);
  const [v2Value, setV2Value] = useState(5);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-12 p-8">
      {/* V1: Current Implementation */}
      <div className="flex flex-col items-center gap-4 p-8 border border-border rounded-lg">
        <span className="text-sm text-muted-foreground font-medium">V1 (Current)</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setV1Value(v => Math.max(0, v - 1))}
            className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 text-foreground text-2xl font-bold flex items-center justify-center transition-colors"
          >
            −
          </button>

          <div className="text-4xl font-mono w-auto text-center">
            <AnimatedNumber value={v1Value} />
          </div>

          <button
            onClick={() => setV1Value(v => v + 1)}
            className="w-12 h-12 rounded-full bg-muted hover:bg-muted/80 text-foreground text-2xl font-bold flex items-center justify-center transition-colors"
          >
            +
          </button>
        </div>
        <span className="text-xs text-muted-foreground">Value: {v1Value}</span>
      </div>

      {/* V2: New Implementation (No animations yet) */}
      <div className="flex flex-col items-center gap-4 p-8 border border-border rounded-lg">
        <span className="text-sm text-muted-foreground font-medium">V2 (Static - No Animations)</span>
        <div className="flex items-center gap-4">
          {/* +/- 1 controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setV2Value(v => Math.max(0, v - 1))}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xl font-bold flex items-center justify-center transition-colors"
            >
              −
            </button>
            <button
              onClick={() => setV2Value(v => v + 1)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xl font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          <div className="text-4xl font-mono min-w-[100px] text-center">
            <AnimatedNumberV2 value={v2Value} />
          </div>

          {/* ×10 / ÷10 controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setV2Value(v => Math.max(1, Math.floor(v / 10)))}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
            >
              ÷10
            </button>
            <button
              onClick={() => setV2Value(v => v * 10)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
            >
              ×10
            </button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Value: {v2Value}</span>
      </div>
    </div>
  );
}

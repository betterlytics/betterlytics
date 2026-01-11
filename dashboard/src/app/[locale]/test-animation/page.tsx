'use client';

import { useState } from 'react';
import { AnimatedNumber } from '@/components/animations/AnimatedNumber';

export default function TestAnimationPage() {
  const [value, setValue] = useState(5);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-12 p-8">
      <div className="flex flex-col items-center gap-4 p-8 border border-border rounded-lg">
        <span className="text-sm text-muted-foreground font-medium">AnimatedNumber</span>
        <div className="flex items-center gap-4">
          {/* +/- 1 controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setValue(v => Math.max(0, v - 1))}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xl font-bold flex items-center justify-center transition-colors"
            >
              −
            </button>
            <button
              onClick={() => setValue(v => v + 1)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xl font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          <div className="text-4xl font-mono w-auto text-center">
            <AnimatedNumber value={value} />
          </div>

          {/* ×10 / ÷10 controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setValue(v => Math.max(1, Math.floor(v / 10)))}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
            >
              ÷10
            </button>
            <button
              onClick={() => setValue(v => v * 10)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
            >
              ×10
            </button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">Value: {value}</span>
      </div>
    </div>
  );
}

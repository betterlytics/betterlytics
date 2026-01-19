'use client';

import { useState } from 'react';
import { Gauge } from '@/components/animations';

const DEFAULT_SEGMENTS = [
  { percent: 33, color: '#e74c3c' },
  { percent: 34, color: '#f39c12' },
  { percent: 33, color: '#2ecc71' },
];

export default function GaugeDemoPage() {
  const [progress, setProgress] = useState(50);
  const [size, setSize] = useState(300);
  const [strokeWidth, setStrokeWidth] = useState(16);
  const [gapDeg, setGapDeg] = useState(2);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-8">
      {/* Main display */}
      <div className="flex flex-col items-center gap-8 p-8 mb-12">
        <Gauge
          segments={DEFAULT_SEGMENTS}
          progress={progress}
          size={size}
          strokeWidth={strokeWidth}
          gapDeg={gapDeg}
        />

        {/* Progress value display */}
        <div className="text-sm text-muted-foreground font-mono bg-muted px-4 py-2 rounded">
          Progress: {progress.toFixed(2)}%
        </div>
      </div>

      {/* Controls panel */}
      <div className="flex flex-col gap-6 p-8 border border-border rounded-xl w-full max-w-lg bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Playground Controls</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">gauge</span>
        </div>

        {/* Progress slider (0-100 with 2 decimal precision) */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-muted-foreground">Progress</label>
            <span className="text-sm font-mono">{progress.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="w-full h-2"
          />
        </div>

        {/* Size slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-muted-foreground">Size</label>
            <span className="text-sm font-mono">{size}px</span>
          </div>
          <input
            type="range"
            min={100}
            max={600}
            step={10}
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-full h-2"
          />
        </div>

        {/* Stroke width slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-muted-foreground">Stroke Width</label>
            <span className="text-sm font-mono">{strokeWidth}px</span>
          </div>
          <input
            type="range"
            min={4}
            max={40}
            step={2}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-full h-2"
          />
        </div>

        {/* Gap degrees slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-muted-foreground">Gap Degrees</label>
            <span className="text-sm font-mono">{gapDeg}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={gapDeg}
            onChange={(e) => setGapDeg(parseInt(e.target.value))}
            className="w-full h-2"
          />
        </div>

        {/* Quick value buttons */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Quick Values</label>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setProgress(0)} className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">0%</button>
            <button onClick={() => setProgress(25)} className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">25%</button>
            <button onClick={() => setProgress(50)} className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">50%</button>
            <button onClick={() => setProgress(75)} className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">75%</button>
            <button onClick={() => setProgress(100)} className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">100%</button>
            <button onClick={() => setProgress(Math.random() * 100)} className="px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded col-span-3">🎲 Random</button>
          </div>
        </div>
      </div>
    </div>
  );
}

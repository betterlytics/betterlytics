'use client';

import { useState } from 'react';
import { Gauge } from '@/components/animations';

const DEFAULT_SEGMENTS = [
  { percent: 33, color: '#2ecc71' },
  { percent: 34, color: '#f39c12' },
  { percent: 33, color: '#e74c3c' },
];

export default function GaugeDemoPage() {
  const [progress, setProgress] = useState(50);
  const [size, setSize] = useState(300);
  const [strokeWidth, setStrokeWidth] = useState(16);
  const [gapDeg, setGapDeg] = useState(2);
  const [arcGap, setArcGap] = useState(4);
  const [widthRatio, setWidthRatio] = useState(1.15);
  const [title, setTitle] = useState('Progress');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-8 py-12">
        <div className="relative">
          <Gauge
            segments={DEFAULT_SEGMENTS}
            progress={progress}
            size={size}
            strokeWidth={strokeWidth}
            gapDeg={gapDeg}
            arcGap={arcGap}
            widthRatio={widthRatio}
            title={title}
          />
        </div>

        {/* Status indicator */}
        <div className="text-xs font-mono bg-muted text-muted-foreground px-3 py-1.5 rounded-full shadow-sm border border-border">
          Current: {progress.toFixed(2)}%
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-4xl bg-card p-8 rounded-3xl shadow-xl border border-border flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gauge Playground</h1>
            <p className="text-sm text-muted-foreground">Customize the segmented gauge component in real-time</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md">
            Component Demo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Visuals Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Appearance</h3>
            
            <Control label="Display Title" type="text" value={title} onChange={setTitle} />
            
            <Control 
              label="Progress Value" 
              type="range" 
              min={0} max={100} step={0.01} 
              value={progress} 
              onChange={setProgress} 
              suffix={`${progress.toFixed(2)}%`}
            />

            <Control 
              label="Container Size" 
              type="range" 
              min={150} max={500} step={10} 
              value={size} 
              onChange={setSize} 
              suffix={`${size}px`}
            />
          </div>

          {/* Configuration Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Geometry</h3>
            
            <Control 
              label="Arc Thickness" 
              type="range" 
              min={4} max={40} step={2} 
              value={strokeWidth} 
              onChange={setStrokeWidth} 
              suffix={`${strokeWidth}px`}
            />

            <div className="grid grid-cols-2 gap-4">
              <Control 
                label="Segment Gap" 
                type="range" 
                min={0} max={10} step={1} 
                value={gapDeg} 
                onChange={setGapDeg} 
                suffix={`${gapDeg}°`}
              />
              <Control 
                label="Arc Spacing" 
                type="range" 
                min={0} max={20} step={1} 
                value={arcGap} 
                onChange={setArcGap} 
                suffix={`${arcGap}px`}
              />
            </div>

            <Control 
              label="Stretch Ratio" 
              type="range" 
              min={0.8} max={1.8} step={0.01} 
              value={widthRatio} 
              onChange={setWidthRatio} 
              suffix={widthRatio.toFixed(2)}
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2.5">Presets</span>
            {[0, 25, 50, 75, 100].map(v => (
              <button 
                key={v}
                onClick={() => setProgress(v)}
                className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 border border-border"
              >
                {v}%
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setProgress(Math.random() * 100)}
            className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
          >
            🎲 Random Value
          </button>
        </div>
      </div>
    </div>
  );
}

function Control({ label, type, value, onChange, min, max, step, suffix }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</label>
        {suffix && <span className="text-[10px] font-mono text-muted-foreground/60">{suffix}</span>}
      </div>
      {type === 'text' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium text-foreground"
        />
      ) : (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary transition-all hover:bg-muted-foreground/10"
        />
      )}
    </div>
  );
}



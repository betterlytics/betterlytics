'use client';

import { useState } from 'react';
import { AnimatedNumber } from '@/components/animations/AnimatedNumber';

export default function TestAnimationPage() {
  const [value, setValue] = useState(5);
  const [inputValue, setInputValue] = useState('5');
  const [duration, setDuration] = useState(800);
  const [className, setClassName] = useState('text-4xl font-mono');
  const [customStyle, setCustomStyle] = useState('');

  // Sync input when value changes from buttons
  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    setInputValue(String(newValue));
  };

  // Parse custom style string to object
  const styleObject = customStyle
    ? Object.fromEntries(
        customStyle.split(';').filter(Boolean).map(s => {
          const [key, val] = s.split(':').map(x => x.trim());
          return [key, val];
        })
      )
    : {};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-8">
      {/* Main display */}
      <div className="flex flex-col items-center gap-4 p-8 border border-border rounded-lg">
        <span className="text-sm text-muted-foreground font-medium">AnimatedNumber Preview</span>
        
        <div className="flex items-center gap-4">
          {/* +/- 1 controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleValueChange(value - 1)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xl font-bold flex items-center justify-center transition-colors"
            >
              −
            </button>
            <button
              onClick={() => handleValueChange(value + 1)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-xl font-bold flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          <div className={className} style={styleObject}>
            <AnimatedNumber value={value} duration={duration} />
          </div>

          {/* ×10 / ÷10 controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleValueChange(Math.trunc(value / 10) || (value < 0 ? -1 : 1))}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
            >
              ÷10
            </button>
            <button
              onClick={() => handleValueChange(value * 10)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
            >
              ×10
            </button>
          </div>
        </div>
      </div>

      {/* Controls panel */}
      <div className="flex flex-col gap-4 p-6 border border-border rounded-lg w-full max-w-md">
        <span className="text-sm text-muted-foreground font-medium">Controls</span>
        
        {/* Direct value input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Value (press Enter)</label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleValueChange(parseFloat(inputValue) || 0);
              }
            }}
            onBlur={() => handleValueChange(parseFloat(inputValue) || 0)}
            className="px-3 py-2 border border-border rounded bg-background text-foreground"
          />
        </div>

        {/* Duration slider */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Duration: {duration}ms</label>
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* ClassName input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">className</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. text-4xl font-mono text-red-500"
            className="px-3 py-2 border border-border rounded bg-background text-foreground font-mono text-xs"
          />
        </div>

        {/* Style input */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">style (CSS)</label>
          <input
            type="text"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            placeholder="e.g. color: red; font-size: 48px"
            className="px-3 py-2 border border-border rounded bg-background text-foreground font-mono text-xs"
          />
        </div>

        {/* Quick test buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button onClick={() => handleValueChange(0)} className="px-3 py-1 text-xs bg-muted rounded">0</button>
          <button onClick={() => handleValueChange(100)} className="px-3 py-1 text-xs bg-muted rounded">100</button>
          <button onClick={() => handleValueChange(-50)} className="px-3 py-1 text-xs bg-muted rounded">-50</button>
          <button onClick={() => handleValueChange(999)} className="px-3 py-1 text-xs bg-muted rounded">999</button>
          <button onClick={() => handleValueChange(1000)} className="px-3 py-1 text-xs bg-muted rounded">1000</button>
          <button onClick={() => handleValueChange(-1234)} className="px-3 py-1 text-xs bg-muted rounded">-1234</button>
        </div>
      </div>
    </div>
  );
}

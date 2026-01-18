'use client';

import { useState, useMemo } from 'react';
import { NumberRoll } from '@/components/animations';

const FORMAT_PRESETS = [
  { label: 'Integer', options: {} },
  { label: 'Decimals (2)', options: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
  { label: 'Currency (USD)', options: { style: 'currency', currency: 'USD' } as Intl.NumberFormatOptions },
  { label: 'Currency (EUR)', options: { style: 'currency', currency: 'EUR' } as Intl.NumberFormatOptions },
  { label: 'Percent', options: { style: 'percent' } as Intl.NumberFormatOptions },
  { label: 'Compact', options: { notation: 'compact' } as Intl.NumberFormatOptions },
  { label: 'Scientific', options: { notation: 'scientific' } as Intl.NumberFormatOptions },
] as const;

const LOCALE_PRESETS = [
  { label: 'Browser Default', value: undefined },
  { label: 'English (US)', value: 'en-US' },
  { label: 'German', value: 'de-DE' },
  { label: 'French', value: 'fr-FR' },
  { label: 'Danish', value: 'da-DK' },
  { label: 'Japanese', value: 'ja-JP' },
] as const;

// 50 diverse test values for stress testing
const STRESS_TEST_VALUES = [
  0, 1, -1, 9, 10, 99, 100, 999, 1000, -1000,
  1234, 9999, 10000, 12345, 99999, 100000, 123456,
  999999, 1000000, 1234567, 9999999, 10000000, 12345678,
  99999999, 100000000, -50, -100, -999, -9999, -99999,
  -999999, -9999999, 7, 77, 777, 7777, 77777, 777777,
  7777777, 77777777, 42, 420, 4200, 42000, 420000,
  4200000, 42000000, 3, 33, 333,
];

export default function ReactNumberRollDemoPage() {
  const [value, setValue] = useState(1234.56);
  const [inputValue, setInputValue] = useState('1234.56');
  const [duration, setDuration] = useState(800);
  const [className, setClassName] = useState('text-9xl font-semibold tracking-tighter');
  const [customStyle, setCustomStyle] = useState('');
  const [withTextSelect, setWithTextSelect] = useState(false);
  const [formatPresetIdx, setFormatPresetIdx] = useState(0);
  const [localePresetIdx, setLocalePresetIdx] = useState(0);

  const formatOptions = FORMAT_PRESETS[formatPresetIdx].options;
  const locales = LOCALE_PRESETS[localePresetIdx].value ?? 'en-US';

  // Preview the formatted output - use explicit locale to prevent hydration mismatch
  const formattedPreview = useMemo(() => {
    try {
      return new Intl.NumberFormat(locales, formatOptions).format(value);
    } catch {
      return 'Invalid format';
    }
  }, [value, locales, formatOptions]);

  // Sync input when value changes from buttons
  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    setInputValue(String(newValue));
  };

  // Full random: value, locale, and format options
  const handleFullRandom = () => {
    const randomValue = STRESS_TEST_VALUES[Math.floor(Math.random() * STRESS_TEST_VALUES.length)];
    const randomLocaleIdx = Math.floor(Math.random() * LOCALE_PRESETS.length);
    const randomFormatIdx = Math.floor(Math.random() * FORMAT_PRESETS.length);
    
    setValue(randomValue);
    setInputValue(String(randomValue));
    setLocalePresetIdx(randomLocaleIdx);
    setFormatPresetIdx(randomFormatIdx);
  };

  // Parse custom style string to object
  const styleObject = customStyle
    ? Object.fromEntries(
        customStyle.split(';').filter(Boolean).map((s: string) => {
          const [key, val] = s.split(':').map((x: string) => x.trim());
          return [key, val];
        })
      )
    : {};

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-8">
      {/* Main display */}
      <div className="flex flex-col items-center gap-12 p-8 mb-24">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleValueChange(value - 1)}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-2xl font-medium flex items-center justify-center transition-colors shrink-0"
            aria-label="Decrement"
          >
            -
          </button>
          
          <div className={className} style={{ ...styleObject, fontVariantNumeric: 'tabular-nums' }}>
            <NumberRoll value={value} locales={locales} formatOptions={formatOptions} duration={duration} withTextSelect={withTextSelect} />
          </div>

          <button 
            onClick={() => handleValueChange(value + 1)}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-2xl font-medium flex items-center justify-center transition-colors shrink-0"
            aria-label="Increment"
          >
            +
          </button>
        </div>

        {/* Format preview */}
        <div className="text-sm text-muted-foreground font-mono bg-muted px-4 py-2 rounded">
          Intl.format: {formattedPreview}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full max-w-2xl">
          <button onClick={() => handleValueChange(0)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">Reset to 0</button>
          <button onClick={() => handleValueChange(100)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">To 100</button>
          <button onClick={() => handleValueChange(-50)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">To -50</button>
          <button onClick={() => handleValueChange(99999999)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">To 99,999,999</button>
          <button onClick={handleFullRandom} className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded col-span-2">🎲 Full Random</button>
          <button onClick={() => handleValueChange(Math.floor(value * 10))} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">* 10</button>
          <button onClick={() => handleValueChange(Math.floor(value / 10))} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 transition-colors rounded">/ 10</button>
        </div>
      </div>

      {/* Controls panel */}
      <div className="flex flex-col gap-6 p-8 border border-border rounded-xl w-full max-w-lg bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Playground Controls</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">react-number-roll</span>
        </div>

        {/* Format preset selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Format Style</label>
          <div className="flex flex-wrap gap-2">
            {FORMAT_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setFormatPresetIdx(i)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  formatPresetIdx === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Locale selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Locale</label>
          <div className="flex flex-wrap gap-2">
            {LOCALE_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setLocalePresetIdx(i)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  localePresetIdx === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Options */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer">
            <input 
              type="checkbox" 
              checked={withTextSelect} 
              onChange={(e) => setWithTextSelect(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            withTextSelect
          </label>
        </div>

        {/* Direct value input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Value</label>
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
            className="px-4 py-2 border border-input rounded-md bg-transparent text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Duration slider */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-muted-foreground">Duration</label>
            <span className="text-sm font-mono">{duration}ms</span>
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={100}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full h-2 disabled:opacity-50"
          />
        </div>

        {/* ClassName input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Tailwind Classes</label>
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. text-4xl font-mono text-red-500"
            className="px-4 py-2 border border-input rounded-md bg-transparent text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Style input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted-foreground">Custom CSS Style</label>
          <input
            type="text"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            placeholder="e.g. color: red; font-size: 48px"
            className="px-4 py-2 border border-input rounded-md bg-transparent text-foreground font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}

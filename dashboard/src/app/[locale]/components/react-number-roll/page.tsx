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
  { label: 'US', value: 'en-US' },
  { label: 'Germany', value: 'de-DE' },
  { label: 'France', value: 'fr-FR' },
  { label: 'Denmark', value: 'da-DK' },
  { label: 'Japan', value: 'ja-JP' },
] as const;

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

  const formattedPreview = useMemo(() => {
    try {
      return new Intl.NumberFormat(locales, formatOptions).format(value);
    } catch {
      return 'Invalid format';
    }
  }, [value, locales, formatOptions]);

  const handleValueChange = (newValue: number) => {
    setValue(newValue);
    setInputValue(String(newValue));
  };

  const handleFullRandom = () => {
    const randomValue = STRESS_TEST_VALUES[Math.floor(Math.random() * STRESS_TEST_VALUES.length)];
    const randomLocaleIdx = Math.floor(Math.random() * LOCALE_PRESETS.length);
    const randomFormatIdx = Math.floor(Math.random() * FORMAT_PRESETS.length);
    
    setValue(randomValue);
    setInputValue(String(randomValue));
    setLocalePresetIdx(randomLocaleIdx);
    setFormatPresetIdx(randomFormatIdx);
  };

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
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-12 py-12">
        <div className="flex items-center gap-8">
          <button 
            onClick={() => handleValueChange(value - 1)}
            className="w-14 h-14 rounded-2xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center text-3xl font-light hover:scale-105 active:scale-95"
          >
            −
          </button>
          
          <div className={className} style={{ ...styleObject, fontVariantNumeric: 'tabular-nums' }}>
            <NumberRoll value={value} locales={locales} formatOptions={formatOptions} duration={duration} withTextSelect={withTextSelect} />
          </div>

          <button 
            onClick={() => handleValueChange(value + 1)}
            className="w-14 h-14 rounded-2xl bg-card border border-border shadow-sm text-muted-foreground hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center text-3xl font-light hover:scale-105 active:scale-95"
          >
            +
          </button>
        </div>

        {/* Intl Preview */}
        <div className="text-xs font-mono bg-muted text-muted-foreground px-4 py-2 rounded-full shadow-sm border border-border">
          Intl output: <span className="font-bold text-foreground ml-1">{formattedPreview}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full max-w-4xl bg-card p-8 rounded-3xl shadow-xl border border-border flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NumberRoll Playground</h1>
            <p className="text-sm text-muted-foreground">Test high-performance digit animations with localized formatting</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md">
            Component Demo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Formatting Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Formatting</h3>
            
            <Control 
              label="Format Style" 
              type="presets" 
              items={FORMAT_PRESETS} 
              activeIdx={formatPresetIdx} 
              onChange={setFormatPresetIdx} 
            />

            <Control 
              label="Locale" 
              type="presets" 
              items={LOCALE_PRESETS} 
              activeIdx={localePresetIdx} 
              onChange={setLocalePresetIdx} 
            />

            <div className="pt-2">
              <label className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase cursor-pointer group">
                <div className="relative w-10 h-6 bg-muted rounded-full transition-colors group-hover:bg-accent/20">
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-transform ${withTextSelect ? 'translate-x-4 bg-primary' : 'bg-background'}`} />
                </div>
                <input 
                  type="checkbox" 
                  checked={withTextSelect} 
                  onChange={(e) => setWithTextSelect(e.target.checked)}
                  className="hidden"
                />
                Enable Text Selection
              </label>
            </div>
          </div>

          {/* Visuals Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Visuals & Value</h3>
            
            <Control 
              label="Direct Input" 
              type="text" 
              value={inputValue} 
              onChange={setInputValue}
              onKeyEnter={() => handleValueChange(parseFloat(inputValue) || 0)}
              onBlur={() => handleValueChange(parseFloat(inputValue) || 0)}
            />

            <Control 
              label="Animation Duration" 
              type="range" 
              min={100} max={5000} step={100} 
              value={duration} 
              onChange={setDuration} 
              suffix={`${duration}ms`}
            />

            <Control 
              label="Tailwind Classes" 
              type="text" 
              value={className} 
              onChange={setClassName} 
              fontMono
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mr-2.5">Quick Values</span>
            {[0, 100, -50, 999999].map(v => (
              <button 
                key={v}
                onClick={() => handleValueChange(v)}
                className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 border border-border"
              >
                {v}
              </button>
            ))}
            <div className="w-px h-6 bg-border mx-2" />
            <button 
              onClick={() => handleValueChange(Math.floor(value * 10))}
              className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all"
            >
              ×10
            </button>
            <button 
              onClick={() => handleValueChange(Math.floor(value / 10))}
              className="px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all"
            >
              ÷10
            </button>
          </div>
          
          <button 
            onClick={handleFullRandom}
            className="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
          >
            🎲 Chaos Mode
          </button>
        </div>
      </div>
    </div>
  );
}

function Control({ label, type, value, onChange, min, max, step, suffix, items, activeIdx, fontMono, onKeyEnter, onBlur }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{label}</label>
        {suffix && <span className="text-[10px] font-mono text-muted-foreground/60">{suffix}</span>}
      </div>
      
      {type === 'presets' && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item: any, i: number) => (
            <button
              key={item.label}
              onClick={() => onChange(i)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border ${
                activeIdx === i
                  ? 'bg-foreground border-foreground text-background shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-muted-foreground/30'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onKeyEnter?.()}
          onBlur={onBlur}
          className={`w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium text-foreground ${fontMono ? 'font-mono text-[10px]' : ''}`}
        />
      )}

      {type === 'range' && (
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



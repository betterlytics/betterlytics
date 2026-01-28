'use client';

import { useState, useMemo, useCallback } from 'react';
import { NumberRoll } from '@/components/animations';
import { cn } from '@/lib/utils';

const FORMAT_PRESETS = [
  { label: 'Integer', options: {} },
  { label: 'Decimals (2)', options: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
  { label: 'Currency (USD)', options: { style: 'currency', currency: 'USD' } as Intl.NumberFormatOptions },
  { label: 'Currency (EUR)', options: { style: 'currency', currency: 'EUR' } as Intl.NumberFormatOptions },
  { label: 'Percent', options: { style: 'percent' } as Intl.NumberFormatOptions },
  { label: 'Compact', options: { notation: 'compact' } as Intl.NumberFormatOptions },
] as const;

const LOCALE_PRESETS = [
  { label: 'English', value: 'en-US' },
  { label: 'Danish', value: 'da-DK' },
  { label: 'Japanese', value: 'ja-JP' },
] as const;

interface DemoState {
  value: number;
  localePresetIdx: number;
  formatPresetIdx: number;
}

export default function ReactNumberRollDemoPage() {
  const [state, setState] = useState<DemoState>({
    value: 1234.56,
    localePresetIdx: 0,
    formatPresetIdx: 0,
  });
  const [inputValue, setInputValue] = useState('1234.56');
  const [duration, setDuration] = useState(800);
  const [className, setClassName] = useState('text-9xl font-semibold tracking-tighter');
  const [customStyle, setCustomStyle] = useState('');
  const [withTextSelect, setWithTextSelect] = useState(false);

  const formatOptions = useMemo(() => FORMAT_PRESETS[state.formatPresetIdx].options, [state.formatPresetIdx]);
  const locales = useMemo(() => LOCALE_PRESETS[state.localePresetIdx].value ?? 'en-US', [state.localePresetIdx]);

  const handleValueChange = useCallback((newValue: number) => {
    setState((prev) => ({ ...prev, value: newValue }));
    setInputValue(String(newValue));
  }, []);

  const handleFullRandom = useCallback(() => {
    const randomValue = Math.round((Math.random() * 110000 - 10000) * 100) / 100;
    const randomLocaleIdx = Math.floor(Math.random() * LOCALE_PRESETS.length);
    const randomFormatIdx = Math.floor(Math.random() * FORMAT_PRESETS.length);

    setState({
      value: randomValue,
      localePresetIdx: randomLocaleIdx,
      formatPresetIdx: randomFormatIdx,
    });
    setInputValue(String(randomValue));
  }, []);

  // Parse custom style string to object
  const styleObject = useMemo(
    () =>
      customStyle
        ? Object.fromEntries(
            customStyle
              .split(';')
              .filter(Boolean)
              .map((s: string) => {
                const [key, val] = s.split(':').map((x: string) => x.trim());
                return [key, val];
              }),
          )
        : {},
    [customStyle],
  );

  return (
    <div className='bg-background flex min-h-screen flex-col items-center justify-center gap-8 p-8'>
      <div className='flex w-full flex-col items-center gap-12'>
        <div
          className={cn(className, 'flex w-full justify-center py-16')}
          style={{ ...styleObject, fontVariantNumeric: 'tabular-nums' }}
        >
          <NumberRoll
            value={state.value}
            locales={locales}
            formatOptions={formatOptions}
            duration={duration}
            withTextSelect={withTextSelect}
          />
        </div>

        <div className='flex w-full max-w-md flex-col gap-4'>
          <input
            type='range'
            min={-10000}
            max={100000}
            step={1000}
            value={state.value}
            onChange={(e) => handleValueChange(parseFloat(e.target.value))}
            className='h-2 w-full'
          />
          <div className='flex justify-center gap-2'>
            <button
              onClick={() => handleValueChange(state.value - 1)}
              className='bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-medium transition-colors'
              aria-label='Decrement'
            >
              -
            </button>
            <button
              onClick={() => handleValueChange(state.value + 1)}
              className='bg-primary text-primary-foreground hover:bg-primary/90 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-medium transition-colors'
              aria-label='Increment'
            >
              +
            </button>
            <button
              onClick={handleFullRandom}
              className='bg-primary text-primary-foreground hover:bg-primary/90 ml-4 rounded-full px-4 py-2 text-sm font-medium transition-colors'
            >
              Random
            </button>
          </div>
        </div>
      </div>

      {/* Controls panel */}
      <div className='border-border bg-card flex w-full max-w-lg flex-col gap-6 rounded-xl border p-8 shadow-sm'>
        <div className='flex items-center justify-between'>
          <span className='text-lg font-semibold'>Playground Controls</span>
          <span className='text-muted-foreground font-mono text-xs tracking-wider uppercase'>
            react-number-roll
          </span>
        </div>

        {/* Number Presets */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Number Presets</label>
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => setState((prev) => ({ ...prev, value: 672681 }))}
              className={'bg-muted hover:bg-muted/80 rounded-md px-3 py-1.5 text-xs transition-colors'}
            >
              Set 672681
            </button>
            <button
              onClick={() => setState((prev) => ({ ...prev, value: 32671121 }))}
              className={'bg-muted hover:bg-muted/80 rounded-md px-3 py-1.5 text-xs transition-colors'}
            >
              Set 32671121
            </button>
          </div>
        </div>

        {/* Format preset selector */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Format Style</label>
          <div className='flex flex-wrap gap-2'>
            {FORMAT_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setState((prev) => ({ ...prev, formatPresetIdx: i }))}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  state.formatPresetIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Locale selector */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Locale</label>
          <div className='flex flex-wrap gap-2'>
            {LOCALE_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setState((prev) => ({ ...prev, localePresetIdx: i }))}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  state.localePresetIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground flex cursor-pointer items-center gap-2 text-sm font-medium'>
            <input
              type='checkbox'
              checked={withTextSelect}
              onChange={(e) => setWithTextSelect(e.target.checked)}
              className='text-primary focus:ring-primary h-4 w-4 rounded border-gray-300'
            />
            withTextSelect
          </label>
        </div>

        {/* Direct value input */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Value</label>
          <input
            type='number'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleValueChange(parseFloat(inputValue) || 0);
              }
            }}
            onBlur={() => handleValueChange(parseFloat(inputValue) || 0)}
            className='border-input text-foreground focus:ring-ring rounded-md border bg-transparent px-4 py-2 focus:ring-2 focus:outline-none'
          />
        </div>

        {/* Duration slider */}
        <div className='flex flex-col gap-2'>
          <div className='flex justify-between'>
            <label className='text-muted-foreground text-sm font-medium'>Duration</label>
            <span className='font-mono text-sm'>{duration}ms</span>
          </div>
          <input
            type='range'
            min={100}
            max={5000}
            step={100}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className='h-2 w-full disabled:opacity-50'
          />
        </div>

        {/* ClassName input */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Tailwind Classes</label>
          <input
            type='text'
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder='e.g. text-4xl font-mono text-red-500'
            className='border-input text-foreground focus:ring-ring rounded-md border bg-transparent px-4 py-2 font-mono text-xs focus:ring-2 focus:outline-none'
          />
        </div>

        {/* Style input */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Custom CSS Style</label>
          <input
            type='text'
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value)}
            placeholder='e.g. color: red; font-size: 48px'
            className='border-input text-foreground focus:ring-ring rounded-md border bg-transparent px-4 py-2 font-mono text-xs focus:ring-2 focus:outline-none'
          />
        </div>
      </div>
    </div>
  );
}

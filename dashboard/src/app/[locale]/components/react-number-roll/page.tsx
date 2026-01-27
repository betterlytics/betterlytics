'use client';

import { useState, useMemo, useCallback } from 'react';
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
  0, 1, -1, 9, 10, 99, 100, 999, 1000, -1000, 1234, 9999, 10000, 12345, 99999, 100000, 123456, 999999, 1000000,
  1234567, 9999999, 10000000, 12345678, 99999999, 100000000, -50, -100, -999, -9999, -99999, -999999, -9999999, 7,
  77, 777, 7777, 77777, 777777, 7777777, 77777777, 42, 420, 4200, 42000, 420000, 4200000, 42000000, 3, 33, 333,
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

  const formatOptions = useMemo(() => FORMAT_PRESETS[formatPresetIdx].options, [formatPresetIdx]);
  const locales = useMemo(() => LOCALE_PRESETS[localePresetIdx].value ?? 'en-US', [localePresetIdx]);

  // Preview the formatted output - use explicit locale to prevent hydration mismatch
  const formattedPreview = useMemo(() => {
    try {
      return new Intl.NumberFormat(locales, formatOptions).format(value);
    } catch {
      return 'Invalid format';
    }
  }, [value, locales, formatOptions]);

  // Sync input when value changes from buttons
  const handleValueChange = useCallback((newValue: number) => {
    setValue(newValue);
    setInputValue(String(newValue));
  }, []);

  // Full random: value, locale, and format options
  const handleFullRandom = useCallback(async () => {
    const randomValue = STRESS_TEST_VALUES[Math.floor(Math.random() * STRESS_TEST_VALUES.length)];
    const randomLocaleIdx = Math.floor(Math.random() * LOCALE_PRESETS.length);
    const randomFormatIdx = Math.floor(Math.random() * FORMAT_PRESETS.length);

    setValue(randomValue);
    setInputValue(String(randomValue));
    setLocalePresetIdx(randomLocaleIdx);
    setFormatPresetIdx(randomFormatIdx);
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
      {/* Main display */}
      <div className='mb-24 flex w-full flex-col items-center gap-12 p-8'>
        <div className='flex items-center gap-4'>
          <button
            onClick={() => handleValueChange(value - 1)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-medium transition-colors'
            aria-label='Decrement'
          >
            -
          </button>

          <div className={className} style={{ ...styleObject, fontVariantNumeric: 'tabular-nums' }}>
            <NumberRoll
              value={value}
              locales={locales}
              formatOptions={formatOptions}
              duration={duration}
              withTextSelect={withTextSelect}
            />
          </div>

          <button
            onClick={() => handleValueChange(value + 1)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-medium transition-colors'
            aria-label='Increment'
          >
            +
          </button>
        </div>

        {/* Format preview */}
        <div className='text-muted-foreground bg-muted rounded px-4 py-2 font-mono text-sm'>
          Intl.format: {formattedPreview}
        </div>

        <div className='grid w-full max-w-2xl grid-cols-2 gap-2 md:grid-cols-4'>
          <button
            onClick={() => handleValueChange(0)}
            className='bg-muted hover:bg-muted/80 rounded px-4 py-2 text-sm transition-colors'
          >
            Reset to 0
          </button>
          <button
            onClick={() => handleValueChange(100)}
            className='bg-muted hover:bg-muted/80 rounded px-4 py-2 text-sm transition-colors'
          >
            To 100
          </button>
          <button
            onClick={() => handleValueChange(-50)}
            className='bg-muted hover:bg-muted/80 rounded px-4 py-2 text-sm transition-colors'
          >
            To -50
          </button>
          <button
            onClick={() => handleValueChange(99999999)}
            className='bg-muted hover:bg-muted/80 rounded px-4 py-2 text-sm transition-colors'
          >
            To 99,999,999
          </button>
          <button
            onClick={() => setTimeout(() => handleFullRandom(), 0)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 col-span-2 rounded px-4 py-2 text-sm transition-colors'
          >
            🎲 Full Random
          </button>
          <button
            onClick={() => handleValueChange(Math.floor(value * 10))}
            className='bg-muted hover:bg-muted/80 rounded px-4 py-2 text-sm transition-colors'
          >
            * 10
          </button>
          <button
            onClick={() => handleValueChange(Math.floor(value / 10))}
            className='bg-muted hover:bg-muted/80 rounded px-4 py-2 text-sm transition-colors'
          >
            / 10
          </button>
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

        {/* Format preset selector */}
        <div className='flex flex-col gap-2'>
          <label className='text-muted-foreground text-sm font-medium'>Format Style</label>
          <div className='flex flex-wrap gap-2'>
            {FORMAT_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setFormatPresetIdx(i)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  formatPresetIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
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
                onClick={() => setLocalePresetIdx(i)}
                className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                  localePresetIdx === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
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

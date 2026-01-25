'use client';

import { useState, useMemo } from 'react';
import { NumberRoll } from '@/components/animations';
import {
  ComponentDocLayout,
  DocSection,
  CodeBlock,
  InstallBlock,
  PropTable,
  FeatureCard,
  Callout,
} from '@/components/docs';
import { Globe, Zap, Type, Settings, Languages, Hash, Feather } from 'lucide-react';

const NUMBER_ROLL_CONFIG = {
  name: 'NumberRoll',
  slug: 'react-number-roll',
  packageName: 'react-number-roll',
  npmUrl: 'https://www.npmjs.com/package/react-number-roll',
  githubUrl: 'https://github.com/betterlytics/betterlytics',
  description: 'High-performance animated number display with Intl formatting',
};

const NUMBER_ROLL_PROPS = [
  {
    name: 'value',
    type: 'number',
    description: 'The numeric value to display and animate.',
    required: true,
  },
  {
    name: 'locales',
    type: 'Intl.LocalesArgument',
    default: "'en-US'",
    description: 'Locale(s) for number formatting.',
  },
  {
    name: 'formatOptions',
    type: 'Intl.NumberFormatOptions',
    default: '{}',
    description: 'Options passed to Intl.NumberFormat for custom formatting.',
  },
  {
    name: 'duration',
    type: 'number',
    default: '600',
    description: 'Animation duration in milliseconds.',
  },
  {
    name: 'withTextSelect',
    type: 'boolean',
    default: 'false',
    description: 'Enable text selection of the displayed number.',
  },
  {
    name: 'className',
    type: 'string',
    description: 'Additional CSS classes for styling.',
  },
];

const BASIC_USAGE = `import { NumberRoll } from 'react-number-roll';

export default function Counter() {
  const [count, setCount] = useState(1234);

  return (
    <div>
      <NumberRoll value={count} />
      <button onClick={() => setCount(c => c + 1)}>
        Increment
      </button>
    </div>
  );
}`;

const CURRENCY_EXAMPLE = `import { NumberRoll } from 'react-number-roll';

export default function PriceDisplay({ price }: { price: number }) {
  return (
    <NumberRoll
      value={price}
      locales="en-US"
      formatOptions={{
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }}
      className="text-4xl font-bold"
    />
  );
}`;

const PERCENTAGE_EXAMPLE = `import { NumberRoll } from 'react-number-roll';

export default function ProgressIndicator({ progress }: { progress: number }) {
  return (
    <NumberRoll
      value={progress / 100}
      formatOptions={{ style: 'percent' }}
      duration={500}
      className="text-2xl"
    />
  );
}`;

const LOCALIZATION_EXAMPLE = `import { NumberRoll } from 'react-number-roll';

// German formatting: 1.234,56
<NumberRoll value={1234.56} locales="de-DE" />

// French formatting: 1 234,56
<NumberRoll value={1234.56} locales="fr-FR" />

// Japanese formatting with currency
<NumberRoll
  value={1234}
  locales="ja-JP"
  formatOptions={{ style: 'currency', currency: 'JPY' }}
/>`;

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
  const [duration, setDuration] = useState(600);
  const [className, setClassName] = useState('text-9xl font-semibold tracking-tighter');
  const [withTextSelect, setWithTextSelect] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
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

  const documentation = (
    <div className="space-y-8">
      <DocSection title="Installation" icon={<Settings className="h-5 w-5" />}>
        <InstallBlock packageName="react-number-roll" />
      </DocSection>

      <DocSection title="Features" icon={<Zap className="h-5 w-5" />}>
        <Callout type="tip" title="Zero Dependencies">
          This component uses <strong>pure CSS animations</strong> — no external animation libraries required. Keep your bundle lightweight while still getting smooth, performant animations.
        </Callout>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
          <FeatureCard
            icon={<Feather className="h-6 w-6" />}
            title="Lightweight"
            description="Pure CSS animations keep your bundle small with zero dependencies."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="High Performance"
            description="Optimized digit-by-digit animations using CSS transforms."
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6" />}
            title="Intl Formatting"
            description="Full Intl.NumberFormat support for locale-aware display."
          />
          <FeatureCard
            icon={<Type className="h-6 w-6" />}
            title="Fully Stylable"
            description="Apply any Tailwind or CSS classes for complete control."
          />
        </div>
      </DocSection>

      <DocSection title="Basic Usage" icon={<Hash className="h-5 w-5" />}>
        <CodeBlock code={BASIC_USAGE} filename="Counter.tsx" />
      </DocSection>

      <DocSection title="API Reference" icon={<Settings className="h-5 w-5" />}>
        <PropTable props={NUMBER_ROLL_PROPS} />
      </DocSection>

      <DocSection title="Currency Formatting" defaultOpen={false}>
        <p className="mb-4 text-muted-foreground">
          Display prices and monetary values with proper currency symbols and formatting.
        </p>
        <CodeBlock code={CURRENCY_EXAMPLE} filename="PriceDisplay.tsx" />
      </DocSection>

      <DocSection title="Percentage Display" defaultOpen={false}>
        <p className="mb-4 text-muted-foreground">
          Show percentages with automatic % symbol. Pass decimal values (0.75 for 75%).
        </p>
        <CodeBlock code={PERCENTAGE_EXAMPLE} filename="ProgressIndicator.tsx" />
      </DocSection>

      <DocSection title="Localization" defaultOpen={false}>
        <p className="mb-4 text-muted-foreground">
          Different locales use different thousand separators, decimal points, and currency formats.
        </p>
        <CodeBlock code={LOCALIZATION_EXAMPLE} filename="LocalizedNumbers.tsx" />
      </DocSection>
    </div>
  );

  return (
    <ComponentDocLayout config={NUMBER_ROLL_CONFIG} documentation={documentation}>
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-12 py-8">
        <div className="flex items-center gap-8">
          <button
            onClick={() => handleValueChange(value - 1)}
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-3xl font-light text-muted-foreground shadow-sm transition-all hover:scale-105 hover:border-primary/30 hover:text-primary active:scale-95"
          >
            −
          </button>

          <div
            className={`${className} cursor-pointer transition-opacity hover:opacity-80`}
            style={{
              fontVariantNumeric: 'tabular-nums',
              ...(reducedMotion ? { '--reduced-duration': '0ms' } as React.CSSProperties : {}),
            }}
            onClick={handleFullRandom}
            title="Click for chaos mode"
          >
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
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-3xl font-light text-muted-foreground shadow-sm transition-all hover:scale-105 hover:border-primary/30 hover:text-primary active:scale-95"
          >
            +
          </button>
        </div>

        {/* Intl Preview */}
        <div className="rounded-full border border-border bg-muted px-4 py-2 font-mono text-xs text-muted-foreground shadow-sm">
          Intl output: <span className="ml-1 font-bold text-foreground">{formattedPreview}</span>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">NumberRoll Playground</h1>
            <p className="text-sm text-muted-foreground">
              Test high-performance digit animations with localized formatting
            </p>
          </div>
          <span className="rounded-md bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            Interactive
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          {/* Formatting Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Formatting
            </h3>

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

            <div className="flex flex-col gap-3 pt-2">
              <label className="group flex cursor-pointer items-center gap-3 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="relative h-6 w-10 rounded-full bg-muted transition-colors group-hover:bg-accent/20">
                  <div
                    className={`absolute left-1 top-1 h-4 w-4 rounded-full shadow-sm transition-transform ${
                      withTextSelect ? 'translate-x-4 bg-primary' : 'bg-background'
                    }`}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={withTextSelect}
                  onChange={(e) => setWithTextSelect(e.target.checked)}
                  className="hidden"
                />
                Enable Text Selection
              </label>

              <label className="group flex cursor-pointer items-center gap-3 text-[10px] font-bold uppercase text-muted-foreground">
                <div className="relative h-6 w-10 rounded-full bg-muted transition-colors group-hover:bg-accent/20">
                  <div
                    className={`absolute left-1 top-1 h-4 w-4 rounded-full shadow-sm transition-transform ${
                      reducedMotion ? 'translate-x-4 bg-primary' : 'bg-background'
                    }`}
                  />
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="hidden"
                />
                Reduced Motion
              </label>
            </div>
          </div>

          {/* Visuals Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Visuals & Value
            </h3>

            <Control
              label="Direct Input"
              type="text"
              value={inputValue}
              onChange={setInputValue}
              onKeyEnter={() => handleValueChange(parseFloat(inputValue) || 0)}
              onBlur={() => handleValueChange(parseFloat(inputValue) || 0)}
            />

            <Control
              label="Value Slider"
              type="range"
              min={0}
              max={100}
              step={0.01}
              value={Math.max(0, Math.min(100, value))}
              onChange={handleValueChange}
              suffix={`${value.toFixed(2)}`}
            />

            <Control
              label="Animation Duration"
              type="range"
              min={100}
              max={5000}
              step={100}
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
        <div className="mt-8 flex flex-col items-center justify-between gap-6 border-t border-border pt-8 sm:flex-row">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2.5 text-[10px] font-bold uppercase text-muted-foreground">
              Quick Values
            </span>
            {[0, 100, -50, 999999].map((v) => (
              <button
                key={v}
                onClick={() => handleValueChange(v)}
                className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground active:scale-95"
              >
                {v}
              </button>
            ))}
            <div className="mx-2 h-6 w-px bg-border" />
            <button
              onClick={() => handleValueChange(Math.floor(value * 10))}
              className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20"
            >
              ×10
            </button>
            <button
              onClick={() => handleValueChange(Math.floor(value / 10))}
              className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition-all hover:bg-primary/20"
            >
              ÷10
            </button>
          </div>

          <button
            onClick={handleFullRandom}
            className="w-full rounded-xl bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 sm:w-auto"
          >
            Chaos Mode
          </button>
        </div>
      </div>
    </ComponentDocLayout>
  );
}

function Control({
  label,
  type,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  items,
  activeIdx,
  fontMono,
  onKeyEnter,
  onBlur,
}: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <label className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
          {label}
        </label>
        {suffix && (
          <span className="font-mono text-[10px] text-muted-foreground/60">{suffix}</span>
        )}
      </div>

      {type === 'presets' && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item: any, i: number) => (
            <button
              key={item.label}
              onClick={() => onChange(i)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all ${
                activeIdx === i
                  ? 'border-foreground bg-foreground text-background shadow-sm'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30'
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
          className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 ${
            fontMono ? 'font-mono text-[10px]' : ''
          }`}
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
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary transition-all hover:bg-muted-foreground/10"
        />
      )}
    </div>
  );
}

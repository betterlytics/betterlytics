'use client';

import { useState } from 'react';
import { Gauge } from '@/components/animations';
import {
  ComponentDocLayout,
  DocSection,
  CodeBlock,
  InstallBlock,
  PropTable,
  FeatureCard,
  Callout,
} from '@/components/docs';
import { Palette, Zap, Ruler, Settings, Feather } from 'lucide-react';

const GAUGE_CONFIG = {
  name: 'Gauge',
  slug: 'gauge',
  packageName: 'react-gauge',
  npmUrl: 'https://www.npmjs.com/package/react-gauge',
  githubUrl: 'https://github.com/betterlytics/betterlytics',
  description: 'A customizable segmented gauge component with smooth animations',
};

const DEFAULT_SEGMENTS = [
  { percent: 33, color: '#2ecc71' },
  { percent: 34, color: '#f39c12' },
  { percent: 33, color: '#e74c3c' },
];

const GAUGE_PROPS = [
  {
    name: 'segments',
    type: 'Segment[]',
    description: 'Array of segments defining the gauge sections. Each segment has percent and color.',
    required: true,
  },
  {
    name: 'progress',
    type: 'number',
    description: 'Current progress value from 0 to 100.',
    required: true,
  },
  {
    name: 'size',
    type: 'number',
    default: '300',
    description: 'Container size in pixels.',
  },
  {
    name: 'strokeWidth',
    type: 'number',
    default: '16',
    description: 'Thickness of the gauge arc in pixels.',
  },
  {
    name: 'gapDeg',
    type: 'number',
    default: '2',
    description: 'Gap between segments in degrees.',
  },
  {
    name: 'arcGap',
    type: 'number',
    default: '4',
    description: 'Gap between inner and outer arcs in pixels.',
  },
  {
    name: 'widthRatio',
    type: 'number',
    default: '1',
    description: 'Horizontal stretch ratio for elliptical gauges.',
  },
  {
    name: 'title',
    type: 'string',
    description: 'Label displayed above the percentage value.',
  },
];

const SEGMENT_TYPE = `interface Segment {
  percent: number;  // Percentage of the gauge this segment occupies
  color: string;    // CSS color value for the segment
}`;

const BASIC_USAGE = `import { Gauge } from 'react-gauge';

const segments = [
  { percent: 33, color: '#2ecc71' },  // Green
  { percent: 34, color: '#f39c12' },  // Orange
  { percent: 33, color: '#e74c3c' },  // Red
];

export default function MyComponent() {
  return (
    <Gauge
      segments={segments}
      progress={75}
      title="Performance"
    />
  );
}`;

const ADVANCED_USAGE = `import { Gauge, type Segment } from 'react-gauge';

const segments: Segment[] = [
  { percent: 25, color: '#e74c3c' },  // Poor
  { percent: 25, color: '#f39c12' },  // Fair
  { percent: 25, color: '#3498db' },  // Good
  { percent: 25, color: '#2ecc71' },  // Excellent
];

export default function PerformanceGauge({ score }: { score: number }) {
  return (
    <Gauge
      segments={segments}
      progress={score}
      size={400}
      strokeWidth={20}
      gapDeg={3}
      arcGap={6}
      widthRatio={1.2}
      title="Score"
    />
  );
}`;

export default function GaugeDemoPage() {
  const [progress, setProgress] = useState(50);
  const [size, setSize] = useState(300);
  const [strokeWidth, setStrokeWidth] = useState(16);
  const [gapDeg, setGapDeg] = useState(2);
  const [arcGap, setArcGap] = useState(4);
  const [widthRatio, setWidthRatio] = useState(1.15);
  const [title, setTitle] = useState('Progress');

  const documentation = (
    <div className="space-y-8">
      <DocSection title="Installation" icon={<Settings className="h-5 w-5" />}>
        <InstallBlock packageName="react-gauge" />
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
            icon={<Palette className="h-6 w-6" />}
            title="Customizable Segments"
            description="Define any number of colored segments with precise percentage control."
          />
          <FeatureCard
            icon={<Zap className="h-6 w-6" />}
            title="Smooth Animations"
            description="Fluid progress animations using optimized CSS transforms."
          />
          <FeatureCard
            icon={<Settings className="h-6 w-6" />}
            title="Full TypeScript"
            description="Complete type definitions for props, segments, and events."
          />
        </div>
      </DocSection>

      <DocSection title="Basic Usage" icon={<Zap className="h-5 w-5" />}>
        <CodeBlock code={BASIC_USAGE} filename="MyComponent.tsx" />
      </DocSection>

      <DocSection title="API Reference" icon={<Settings className="h-5 w-5" />}>
        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Gauge Props</h3>
            <PropTable props={GAUGE_PROPS} />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Segment Type</h3>
            <CodeBlock code={SEGMENT_TYPE} language="typescript" />
          </div>
        </div>
      </DocSection>

      <DocSection title="Advanced Example" defaultOpen={false}>
        <CodeBlock code={ADVANCED_USAGE} filename="PerformanceGauge.tsx" />
      </DocSection>
    </div>
  );

  return (
    <ComponentDocLayout config={GAUGE_CONFIG} documentation={documentation}>
      {/* Hero Section */}
      <div className="flex flex-col items-center gap-8 py-8">
        <div
          className="relative cursor-pointer transition-opacity hover:opacity-80"
          onClick={() => setProgress(Math.random() * 100)}
          title="Click for random value"
        >
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
        <div className="rounded-full border border-border bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground shadow-sm">
          Current: {progress.toFixed(2)}%
        </div>
      </div>

      {/* Control Panel */}
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gauge Playground</h1>
            <p className="text-sm text-muted-foreground">
              Customize the segmented gauge component in real-time
            </p>
          </div>
          <span className="rounded-md bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            Interactive
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
          {/* Visuals Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h3>

            <Control label="Display Title" type="text" value={title} onChange={setTitle} />

            <Control
              label="Progress Value"
              type="range"
              min={0}
              max={100}
              step={0.01}
              value={progress}
              onChange={setProgress}
              suffix={`${progress.toFixed(2)}%`}
            />

            <Control
              label="Container Size"
              type="range"
              min={150}
              max={500}
              step={10}
              value={size}
              onChange={setSize}
              suffix={`${size}px`}
            />
          </div>

          {/* Configuration Group */}
          <div className="flex flex-col gap-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Geometry
            </h3>

            <Control
              label="Arc Thickness"
              type="range"
              min={4}
              max={40}
              step={2}
              value={strokeWidth}
              onChange={setStrokeWidth}
              suffix={`${strokeWidth}px`}
            />

            <div className="grid grid-cols-2 gap-4">
              <Control
                label="Segment Gap"
                type="range"
                min={0}
                max={10}
                step={1}
                value={gapDeg}
                onChange={setGapDeg}
                suffix={`${gapDeg}°`}
              />
              <Control
                label="Arc Spacing"
                type="range"
                min={0}
                max={20}
                step={1}
                value={arcGap}
                onChange={setArcGap}
                suffix={`${arcGap}px`}
              />
            </div>

            <Control
              label="Stretch Ratio"
              type="range"
              min={0.8}
              max={1.8}
              step={0.01}
              value={widthRatio}
              onChange={setWidthRatio}
              suffix={widthRatio.toFixed(2)}
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2.5 text-[10px] font-bold uppercase text-muted-foreground">
              Presets
            </span>
            {[0, 25, 50, 75, 100].map((v) => (
              <button
                key={v}
                onClick={() => setProgress(v)}
                className="rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-muted-foreground transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground active:scale-95"
              >
                {v}%
              </button>
            ))}
          </div>

          <button
            onClick={() => setProgress(Math.random() * 100)}
            className="w-full rounded-xl bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 sm:w-auto"
          >
            Random Value
          </button>
        </div>
      </div>
    </ComponentDocLayout>
  );
}

function Control({ label, type, value, onChange, min, max, step, suffix }: any) {
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
      {type === 'text' ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      ) : (
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

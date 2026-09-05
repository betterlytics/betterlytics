import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';

/* Gauges matching the product: zone ring outside, value arc inside, both drawn
   from the thresholds Google publishes. Arc geometry is transcribed from the
   draft, where it was generated from those thresholds. */

type Gauge = {
  key: string;
  value: string;
  unit?: string;
  tone: 'live' | 'warn';
  goodEnd: string;
  valueArc: string;
  len: number;
  delay: string;
};

const TRACK = 'M48.52,117.48 A53,53 0 1 1 123.48,117.48';
const ZONE_START = 'M39.33,126.67 A66,66 0 0 1 ';
const POOR = 'M151.19,69.68 A66,66 0 0 1 132.67,126.67';

const GAUGES: Gauge[] = [
  {
    key: 'FCP',
    value: '1.1',
    unit: 's',
    tone: 'live',
    goodEnd: '79.79,14.29',
    valueArc: '42.16,50.21',
    len: 73.3,
    delay: '0.10s',
  },
  {
    key: 'TTFB',
    value: '210',
    unit: 'ms',
    tone: 'live',
    goodEnd: '44.46,28.71',
    valueArc: '36.13,97.95',
    len: 23.3,
    delay: '0.21s',
  },
  {
    key: 'LCP',
    value: '1.8',
    unit: 's',
    tone: 'live',
    goodEnd: '86.00,14.00',
    valueArc: '53.52,38.12',
    len: 89.9,
    delay: '0.32s',
  },
  {
    key: 'INP',
    value: '142',
    unit: 'ms',
    tone: 'live',
    goodEnd: '36.49,36.35',
    valueArc: '35.14,65.09',
    len: 56.7,
    delay: '0.43s',
  },
  {
    key: 'CLS',
    value: '0.14',
    tone: 'warn',
    goodEnd: '36.49,36.35',
    valueArc: '73.14,28.58',
    len: 111.9,
    delay: '0.54s',
  },
];

function GaugeUnit({ g }: { g: Gauge }) {
  const color = g.tone === 'live' ? 'var(--live)' : 'var(--warn)';
  return (
    <div className='gg__u'>
      <svg viewBox='0 0 172 132' aria-hidden>
        <path className='trk' d={TRACK} fill='none' strokeWidth='11' strokeLinecap='round' />
        <path className='zg' d={ZONE_START + g.goodEnd} fill='none' strokeWidth='4' />
        <path className='zw' d={`M${g.goodEnd} A66,66 0 0 1 151.19,69.68`} fill='none' strokeWidth='4' />
        <path className='zp' d={POOR} fill='none' strokeWidth='4' />
        <path
          className='val'
          d={`M48.52,117.48 A53,53 0 0 1 ${g.valueArc}`}
          fill='none'
          stroke={color}
          strokeWidth='11'
          style={vars({ '--len': g.len, '--d': g.delay })}
        />
        <text className='gg__k' x='86' y='66' textAnchor='middle'>
          {g.key}
        </text>
        <text className='gg__v' x='86' y='92' textAnchor='middle' fill={color}>
          {g.value}
          {g.unit ? <tspan>{g.unit}</tspan> : null}
        </text>
      </svg>
    </div>
  );
}

export function Vitals() {
  return (
    <div className='gg'>
      <div className='gg__row'>
        {GAUGES.slice(0, 2).map((g) => (
          <GaugeUnit key={g.key} g={g} />
        ))}
      </div>
      <div className='gg__row'>
        {GAUGES.slice(2).map((g) => (
          <GaugeUnit key={g.key} g={g} />
        ))}
      </div>
      <div className='gg__lg'>
        <span>
          <i style={{ background: 'var(--live)' }} />
          Good
        </span>
        <span>
          <i style={{ background: 'var(--warn)' }} />
          Needs work
        </span>
        <span>
          <i style={{ background: 'var(--down)' }} />
          Poor
        </span>
      </div>
    </div>
  );
}

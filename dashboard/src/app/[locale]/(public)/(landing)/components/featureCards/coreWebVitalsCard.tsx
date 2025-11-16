import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';

type Segment = { limit: number; color: string };

type Metric = {
  key: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb';
  label: string;
  valueLabel: string;
  value: number;
  scaleMax: number;
  segments: Segment[];
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (Math.PI / 180) * angleDeg;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy - r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArcFlag = Math.abs(endDeg - startDeg) <= 180 ? 0 : 1;
  // sweep-flag = 1 to draw clockwise from left to right across the top half
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function valueToAngle(value: number, scaleMax: number) {
  const n = Math.max(0, Math.min(1, value / scaleMax));
  // Map 0..1 to 180..0 (left to right across the top half)
  return 180 - 180 * n;
}

function segmentToAngles(prev: number, limit: number, scaleMax: number) {
  const a1 = valueToAngle(prev, scaleMax);
  const a2 = valueToAngle(Math.min(limit, scaleMax), scaleMax);
  return { start: a1, end: a2 };
}

export default async function CoreWebVitalsCard() {
  const t = await getTranslations('public.landing.cards.coreWebVitals');
  const tMisc = await getTranslations('misc');

  const goodColor = '#22c55e';
  const fairColor = '#f59e0b';
  const poorColor = '#f43f5e';

  const metrics: Metric[] = [
    {
      key: 'lcp',
      label: 'LCP',
      valueLabel: '1.8s',
      value: 1.8,
      scaleMax: 5.0,
      segments: [
        { limit: 2.5, color: goodColor },
        { limit: 4.0, color: fairColor },
        { limit: 5.0, color: poorColor },
      ],
    },
    {
      key: 'inp',
      label: 'INP',
      valueLabel: '350ms',
      value: 350,
      scaleMax: 600,
      segments: [
        { limit: 200, color: goodColor },
        { limit: 500, color: fairColor },
        { limit: 600, color: poorColor },
      ],
    },
    {
      key: 'cls',
      label: 'CLS',
      valueLabel: '0.05',
      value: 0.05,
      scaleMax: 0.3,
      segments: [
        { limit: 0.1, color: goodColor },
        { limit: 0.25, color: fairColor },
        { limit: 0.3, color: poorColor },
      ],
    },
    {
      key: 'fcp',
      label: 'FCP',
      valueLabel: '1.4s',
      value: 1.4,
      scaleMax: 4.0,
      segments: [
        { limit: 1.8, color: goodColor },
        { limit: 3.0, color: fairColor },
        { limit: 4.0, color: poorColor },
      ],
    },
    {
      key: 'ttfb',
      label: 'TTFB',
      valueLabel: '0.75s',
      value: 0.75,
      scaleMax: 2.2,
      segments: [
        { limit: 0.8, color: goodColor },
        { limit: 1.8, color: fairColor },
        { limit: 2.2, color: poorColor },
      ],
    },
  ];

  const sizePx = 160;
  const r = sizePx / 2 - 2;
  const outerStroke = 6;
  const valueStroke = 14;
  const radialGap = 2;
  const rOuter = r;
  const rValue = rOuter - outerStroke / 2 - radialGap - valueStroke / 2;
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const segGapDeg = 1.2;

  const Gauge = ({ metric }: { metric: Metric }): React.ReactNode => {
    const valueAngle = valueToAngle(metric.value, metric.scaleMax);
    const startAngle = 180;
    const valueColor = metric.segments.find((s) => metric.value <= s.limit)?.color ?? poorColor;
    return (
      <div className='space-y-1' role='group' aria-label={`${metric.label} metric`}>
        <div className='relative flex items-end justify-center'>
          <svg width={sizePx} height={sizePx / 2} viewBox={`0 0 ${sizePx} ${sizePx}`} className='overflow-visible'>
            {metric.segments.map((seg, idx) => {
              const prevLimit = idx === 0 ? 0 : metric.segments[idx - 1].limit;
              const { start, end } = segmentToAngles(prevLimit, seg.limit, metric.scaleMax);
              const adjStart = Math.max(end, start - segGapDeg / 2);
              const adjEnd = Math.min(start, end + segGapDeg / 2);
              return (
                <path
                  key={`${metric.key}-seg-${idx}`}
                  d={describeArc(cx, cy, rOuter, adjStart, adjEnd)}
                  stroke={seg.color}
                  strokeWidth={outerStroke}
                  strokeLinecap='butt'
                  fill='none'
                />
              );
            })}
            <path
              d={describeArc(cx, cy, rValue, startAngle, valueAngle)}
              stroke={valueColor}
              strokeWidth={valueStroke}
              strokeLinecap='butt'
              fill='none'
            />
          </svg>
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-4'>
            <div className='text-muted-foreground text-xs font-medium'>{metric.label}</div>
            <div className='text-sm font-semibold tabular-nums'>{metric.valueLabel}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative gap-0 overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='flex min-h-0 flex-1 flex-col pt-6'>
        <div className='flex flex-1 items-center justify-center'>
          <div className='space-y-6'>
            <div className='grid grid-cols-2 place-items-center gap-2 sm:gap-0 sm:px-3'>
              {metrics.slice(0, 2).map((m) => (
                <Gauge key={m.key} metric={m} />
              ))}
            </div>
            <div className='grid grid-cols-2 place-items-center gap-4 md:grid-cols-3'>
              {metrics.slice(2).map((m) => (
                <div key={m.key} className={m.key === 'ttfb' ? 'hidden md:block' : ''}>
                  <Gauge metric={m} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='text-muted-foreground mt-auto flex items-center justify-center gap-10 pt-4 text-xs'>
          <div className='flex items-center gap-1'>
            <span className='inline-block h-2 w-2 rounded-full' style={{ backgroundColor: goodColor }} />
            <span aria-label={tMisc('good')}>{tMisc('good')}</span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block h-2 w-2 rounded-full' style={{ backgroundColor: fairColor }} />
            <span aria-label={tMisc('fair')}>{tMisc('fair')}</span>
          </div>
          <div className='flex items-center gap-1'>
            <span className='inline-block h-2 w-2 rounded-full' style={{ backgroundColor: poorColor }} />
            <span aria-label={tMisc('poor')}>{tMisc('poor')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React, { useId } from 'react';

type GaugeNeedleProps = {
  center: number;
  needlePoints: string;
  needleAngle: number;
};

function GaugeNeedle({ center, needlePoints, needleAngle }: GaugeNeedleProps) {
  const id = useId();
  const gradientId = `${id}-needle-gradient`;
  const filterId = `${id}-needle-glow`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stopColor='var(--primary)' stopOpacity='0.0' />
          <stop offset='20%' stopColor='var(--cwv-p50)' stopOpacity='0.3' />
          <stop offset='50%' stopColor='var(--cwv-p75)' stopOpacity='0.8' />
          <stop offset='75%' stopColor='var(--cwv-p90)' stopOpacity='0.9' />
          <stop offset='99%' stopColor='var(--cwv-p99)' stopOpacity='1' />
        </linearGradient>
        <filter id={filterId} x='-20%' y='-20%' width='140%' height='140%'>
          <feGaussianBlur in='SourceAlpha' stdDeviation='1' result='blur' />
          <feFlood floodColor='#3ddcff' floodOpacity='0.4' result='color' />
          <feComposite in='color' in2='blur' operator='in' result='glow' />
          <feMerge>
            <feMergeNode in='glow' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>
      <polygon
        points={needlePoints}
        fill={`url(#${gradientId})`}
        filter={`url(#${filterId})`}
        className='gauge-needle'
        transform={`translate(${center}, ${center}) rotate(${needleAngle})`}
      />
    </>
  );
}

export default React.memo(GaugeNeedle);

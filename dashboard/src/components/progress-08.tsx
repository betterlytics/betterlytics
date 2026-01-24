'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  renderLabel?: (progress: number) => number | string;
  size?: number;
  strokeWidth?: number;
  circleStrokeWidth?: number;
  progressStrokeWidth?: number;
  shape?: 'square' | 'round';
  className?: string;
  progressClassName?: string;
  labelClassName?: string;
  showLabel?: boolean;
}

export const CircularProgress = ({
  value,
  renderLabel,
  className,
  progressClassName,
  labelClassName,
  showLabel,
  shape = 'round',
  size = 100,
  strokeWidth,
  circleStrokeWidth = 10,
  progressStrokeWidth = 10,
}: CircularProgressProps) => {
  const effectiveStrokeWidth = strokeWidth ?? circleStrokeWidth;
  const radius = (size - effectiveStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className='relative' style={{ width: size, height: size }}>
      <svg
        className='absolute inset-0'
        height={size}
        width={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          className={cn('stroke-primary/25', className)}
          cx={size / 2}
          cy={size / 2}
          fill='transparent'
          r={radius}
          strokeWidth={effectiveStrokeWidth}
        />
        <circle
          className={cn('stroke-primary transition-all duration-300', progressClassName)}
          cx={size / 2}
          cy={size / 2}
          fill='transparent'
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={shape}
          strokeWidth={strokeWidth ?? progressStrokeWidth}
        />
      </svg>
      {showLabel && (
        <div className={cn('absolute inset-0 flex items-center justify-center text-sm', labelClassName)}>
          {renderLabel ? renderLabel(value) : value}
        </div>
      )}
    </div>
  );
};

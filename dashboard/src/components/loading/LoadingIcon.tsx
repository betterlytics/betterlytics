'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function LoadingIcon() {
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    // trigger animation on mount
    setReveal(true);
  }, []);

  return (
    <div className='relative h-16 w-16 overflow-hidden'>
      {/* Underlying logo */}
      <Image src='/test.svg' alt='logo' width={64} height={64} className='absolute inset-0 z-10' />

      {/* BaseBox overlay */}
      <div
        className={cn('absolute inset-0 z-20', {
          'hide-left-to-right': reveal,
        })}
      >
        <BaseBox width={64} height={64} />
      </div>

      <style jsx>{`
        .hide-left-to-right {
          animation: hide 1.5s forwards;
        }

        @keyframes hide {
          from {
            clip-path: inset(0 0 0 0); /* fully visible */
          }
          to {
            clip-path: inset(0 100% 0 0); /* shrink from left to right */
          }
        }
      `}</style>
    </div>
  );
}

interface BaseBoxProps {
  width: number;
  height: number;
  className?: string;
}

function BaseBox({ width, height, className }: BaseBoxProps) {
  const barWidth = 29;
  const baseWidth = 100;
  const baseHeight = 100;

  const gap = (baseWidth - barWidth * 3) / 2;

  return (
    <div className={cn('absolute inset-0', className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${baseWidth} ${baseHeight}`}
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
      >
        <path d={`M 0 0 V ${baseHeight} h ${barWidth} V 0`} stroke='white' strokeWidth='2' fill='white' />
        <path
          d={`M ${gap + barWidth} 0 V ${baseHeight} h ${barWidth} V 0`}
          stroke='white'
          strokeWidth='2'
          fill='white'
        />
        <path
          d={`M ${gap * 2 + barWidth * 2} 0 V ${baseHeight} h ${barWidth} V 0`}
          stroke='white'
          strokeWidth='2'
          fill='white'
        />
      </svg>
    </div>
  );
}

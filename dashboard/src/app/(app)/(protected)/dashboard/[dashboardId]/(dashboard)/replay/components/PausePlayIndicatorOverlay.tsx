'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

export type PausePlayIndicatorOverlayHandle = {
  show: (icon: 'play' | 'pause') => void;
};

const PausePlayIndicatorOverlayComponent = (
  _props: unknown,
  ref: React.ForwardedRef<PausePlayIndicatorOverlayHandle>,
) => {
  const [visible, setVisible] = useState(false);
  const [lastIcon, setLastIcon] = useState<'play' | 'pause'>('play');
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    show(icon) {
      setLastIcon(icon);
      setVisible(true);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = setTimeout(() => setVisible(false), 600);
    },
  }));

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden='true'
    >
      <div className='rounded-full bg-black/50 p-6'>
        {lastIcon === 'play' ? (
          <Play className='h-14 w-14 text-white' />
        ) : (
          <Pause className='h-14 w-14 text-white' />
        )}
      </div>
    </div>
  );
};

export const PausePlayIndicatorOverlay = forwardRef(PausePlayIndicatorOverlayComponent);

PausePlayIndicatorOverlay.displayName = 'PausePlayIndicatorOverlay';

export default PausePlayIndicatorOverlay;

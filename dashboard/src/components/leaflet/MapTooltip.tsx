import { useMap } from 'react-leaflet/hooks';
import { useEffect, useRef, useId } from 'react';
import { CountryDisplay } from '../language/CountryDisplay';
import { FlagIconProps } from '../icons';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import React from 'react';

type MapTooltipProps = {
  selectedCountry: {
    code: string;
    visitors: number;
  } | null;
  size?: 'sm' | 'lg';
};

type TooltipContentProps = {
  code: string;
  visitors: number;
  size: 'sm' | 'lg';
};

export function getTooltipId(alpha2: string) {
  return `lltooltip-${alpha2}`;
}

const TooltipTipComponent = () => (
  <div
    className={cn(
      'mt-[-8px] h-0 w-0 self-center',
      'border-t-[16px] border-r-[14px] border-l-[14px]',
      'border-t-card border-r-transparent border-l-transparent',
    )}
  />
);
const TooltipTip = React.memo(TooltipTipComponent);

const TooltipContentComponent = ({ code, visitors, size }: TooltipContentProps) => (
  <div
    className={cn(
      'border-border bg-card text-foreground space-y-1 rounded border p-2 text-start shadow-md',
      size === 'sm' ? 'max-w-[200px]' : 'max-w-[40vw]',
    )}
  >
    <CountryDisplay
      className='text-sm font-bold'
      countryCode={code as FlagIconProps['countryCode']}
      countryName={getCountryName(code)}
    />
    <div className='flex gap-1 text-sm whitespace-nowrap'>
      <span className='text-muted-foreground'>Visitors:</span>
      <span className='text-foreground'>{visitors}</span>
    </div>
  </div>
);
const TooltipContent = React.memo(TooltipContentComponent);

TooltipContent.displayName = 'TooltipContent';
TooltipTip.displayName = 'TooltipTip';

export default function MapTooltip({ selectedCountry, size = 'sm' }: MapTooltipProps) {
  const map = useMap();
  const tooltipId = useId();
  const tooltipRef = useRef<HTMLElement | null>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mapContainer = map.getContainer();
    let animationFrame: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY - 2 };

      if (selectedCountry && tooltipRef.current && animationFrame === null) {
        animationFrame = requestAnimationFrame(() => {
          tooltipRef.current!.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
          animationFrame = null;
        });
      }
    };

    mapContainer.addEventListener('mousemove', onMouseMove);

    if (selectedCountry && tooltipRef.current) {
      tooltipRef.current.style.transform = `translate3d(${latestMouseRef.current.x}px, ${latestMouseRef.current.y}px, 0) translate(-50%, -100%)`;
    }

    return () => {
      mapContainer.removeEventListener('mousemove', onMouseMove);
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [map, selectedCountry]);

  if (!selectedCountry) return null;

  const { code, visitors } = selectedCountry;

  return createPortal(
    <section
      id={tooltipId}
      ref={tooltipRef}
      role='tooltip'
      aria-hidden={false}
      className='pointer-events-none fixed top-0 left-0 z-[11] will-change-transform'
    >
      <div
        className='mt-1 flex flex-col'
        style={{
          filter: 'drop-shadow(0 0.5px 2px var(--color-sidebar-accent-foreground))',
        }}
      >
        <TooltipContent code={code} visitors={visitors} size={size} />
        <TooltipTip />
      </div>
    </section>,
    document.body,
  );
}

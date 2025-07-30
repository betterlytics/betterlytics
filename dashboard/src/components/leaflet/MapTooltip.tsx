import { useMap } from 'react-leaflet/hooks';
import { useState, useEffect, useRef, useId } from 'react';
import type * as L from 'leaflet';
import { CountryDisplay } from '../language/CountryDisplay';
import { FlagIconProps } from '../icons';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import React from 'react';

type CountryTooltipProps = {
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

type Coordinate = { x: number; y: number };

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

export default function CountryTooltip({ selectedCountry, size = 'sm' }: CountryTooltipProps) {
  const map = useMap();
  const [mousePos, setMousePos] = useState<Coordinate | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Set mouse position just before the next repaint
      animationFrameRef.current = requestAnimationFrame(() => {
        const containerPoint = map.latLngToContainerPoint(e.latlng);
        const mapContainer = map.getContainer();
        const rect = mapContainer.getBoundingClientRect();

        setMousePos({
          x: containerPoint.x + rect.left,
          y: containerPoint.y + rect.top,
        });
      });
    };

    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('mousemove', handleMouseMove);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setMousePos(null);
    };
  }, [map]);

  if (!selectedCountry || !mousePos) return null;

  const { code, visitors } = selectedCountry;

  // Use portal to lift component stage up for z-index
  return createPortal(
    <section
      id={tooltipId}
      role='tooltip'
      aria-hidden={false}
      className='pointer-events-none absolute z-[9] -translate-x-1/2 -translate-y-full transform'
      style={{
        top: mousePos.y - 2,
        left: mousePos.x,
        position: 'fixed',
      }}
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

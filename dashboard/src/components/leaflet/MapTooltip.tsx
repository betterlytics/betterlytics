import { useMap } from 'react-leaflet';
import { useState, useEffect, useRef, useId, useMemo } from 'react';
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
}

type TooltipContentProps = {
  code: string;
  visitors: number;
  size: 'sm' | 'lg';
};

type Coordinate = { x: number, y: number };

export function getTooltipId(alpha2: string) {
  return `lltooltip-${alpha2}`
}

const TooltipTipComponent = () => 
  <div className={cn(
    "w-0 h-0 mt-[-8px] self-center",
    "border-l-[14px] border-r-[14px] border-t-[16px]",
    "border-l-transparent border-r-transparent border-t-card"
  )} />
const TooltipTip = React.memo(TooltipTipComponent);

const TooltipContentComponent = ({ code, visitors, size }: TooltipContentProps) => 
  <div className={cn(
    "space-y-1 p-2 rounded border border-border bg-card text-foreground shadow-md text-start",
    size === 'sm' ? 'max-w-[200px]' : 'max-w-[40vw]'
  )}>
    <CountryDisplay
      className="font-bold text-sm"
      countryCode={code as FlagIconProps['countryCode']}
      countryName={getCountryName(code)}
    />
    <div className="flex gap-1 text-sm whitespace-nowrap">
      <span className="text-muted-foreground">Visitors:</span>
      <span className="text-foreground">{visitors}</span>
    </div>
  </div>
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
      role="tooltip"
      aria-hidden={false}
      className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full z-[9]"
      style={{
        top: mousePos.y - 2,
        left: mousePos.x,
        position: 'fixed',
      }}
    >
      <div
        className="flex flex-col mt-1"
        style={{
          filter: 'drop-shadow(0 0.5px 2px var(--color-sidebar-accent-foreground))',
        }}
      >
        <TooltipContent code={code} visitors={visitors} size={size} />
        <TooltipTip />
      </div>
    </section>,
    document.body
  );
}

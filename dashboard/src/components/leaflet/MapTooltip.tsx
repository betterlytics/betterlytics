import { useMap } from 'react-leaflet';
import { useState, useEffect, useRef, useId } from 'react';
import type * as L from 'leaflet';
import { CountryDisplay } from '../language/CountryDisplay';
import { FlagIconProps } from '../icons';
import { getCountryName } from '@/utils/countryCodes';
import { cn } from '@/lib/utils';

type CountryTooltipProps = {
  selectedCountry: {
    code: string;
    visitors: number;
  } | null;
  size?: 'sm' | 'lg';
}
type Coordinate = { x: number, y: number };

// TODO: Better types
export function getTooltipId(alpha2: string) {
  return `lltooltip-${alpha2}`
}

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
        setMousePos({ x: containerPoint.x, y: containerPoint.y });
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

  const TooltipTip = () => (
    <div className={cn(
      "w-0 h-0 mt-[-8px] self-center",
      "border-l-[14px] border-r-[14px] border-t-[16px]",
      "border-l-transparent border-r-transparent border-t-card"
    )} 
    />
  );

  const TooltipContent = () => (
    <div className={cn(
      "space-y-1 p-2 rounded border border-border bg-card text-foreground shadow-md text-start",
      size === 'sm' ? 'max-w-180px' : 'max-w-40vw'
    )}>
      <CountryDisplay
        className="font-bold"
        countryCode={code as FlagIconProps['countryCode']}
        countryName={getCountryName(code)}
      />
      <div className="flex gap-1 text-sm whitespace-nowrap">
        <span className="text-muted-foreground">Visitors:</span>
        <span className="text-foreground">{visitors}</span>
      </div>
    </div>
  );

  return (
    <section
      id={tooltipId}
      role="tooltip"
      aria-hidden={false}
      className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full"
      style={{
        top: mousePos.y-2,
        left: mousePos.x,
      }}
    >
      <div className="flex flex-col mt-1"
        style={{
          filter: 'drop-shadow(0 0.5px 2px var(--color-sidebar-accent-foreground))',
        }}
      >
        <TooltipContent/>
        <TooltipTip/>
      </div>
    </section>
  );
}

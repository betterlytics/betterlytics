import { useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';
import type * as L from 'leaflet';
import { CountryDisplay } from '../language/CountryDisplay';
import { FlagIconProps } from '../icons';
import { getCountryName } from '@/utils/countryCodes';

interface CountryTooltipProps {
  selectedCountry: {
    code: string;
    visitors: number;
  } | null;
}

export default function CountryTooltip({ selectedCountry }: CountryTooltipProps) {
  const map = useMap();
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleMouseMove(e: L.LeafletMouseEvent) {
      const containerPoint = map.latLngToContainerPoint(e.latlng);
      setMousePos({ x: containerPoint.x, y: containerPoint.y });
    }

    map.on('mousemove', handleMouseMove);
    return () => {
      map.off('mousemove', handleMouseMove);
      setMousePos(null);
    };
  }, [map]);

  if (!selectedCountry || !mousePos) return null;

  const { code, visitors } = selectedCountry;

  return (
    <div
      style={{
        position: 'absolute',
        top: mousePos.y,
        left: mousePos.x,
        pointerEvents: 'none',
        transform: 'translate(-50%, -100%)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          backgroundColor: 'red',
          borderRadius: '50%',
        }}
      />
      <div className="text-foreground space-y-1 bg-white p-2 rounded shadow-lg border border-gray-300">
        <CountryDisplay
          className="font-bold"
          countryCode={code as FlagIconProps['countryCode']}
          countryName={getCountryName(code)}
        />
        <div className="flex gap-1 text-sm whitespace-nowrap">
          <div className="text-muted-foreground">Visitors:</div>
          <span className="text-foreground">{visitors}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect } from 'react';
import { useMapSelectionActions, type MapFeatureVisitor } from '@/contexts/DeckGLSelectionContextProvider';
import type { GeoVisitorWithCompare } from '@/contexts/DeckGLSelectionContextProvider';

type PickingInfo = {
  object?: { id?: string | number };
  coordinate?: [number, number];
};

type Args = {
  playing: boolean;
  setIsMapHovered: (v: boolean) => void;
  frame: number;
  visitorDict: Record<string, number>;
  compareVisitorDict?: Record<string, number>;
};

export function useDeckGLEventHandlers({
  playing,
  setIsMapHovered,
  frame,
  visitorDict,
  compareVisitorDict = {},
}: Args) {
  const { hoveredFeatureRef, setMapSelection, clickedFeatureRef, updateClickedVisitors } =
    useMapSelectionActions();

  const withCompare = useCallback(
    (country_code: string, visitors: number): GeoVisitorWithCompare => {
      const cv = compareVisitorDict[country_code];
      const dAbs = visitors - cv;
      const dProcent = (dAbs! / (cv ? cv : 1)) * 100;
      return {
        country_code,
        visitors,
        compare: {
          compare_visitors: cv,
          dAbs,
          dProcent,
        },
      };
    },
    [compareVisitorDict],
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (info.object && !playing) {
        const code = String(info.object.id ?? '');
        const visitors = visitorDict[code] ?? 0;

        setMapSelection({
          clicked: {
            longitude: info.coordinate?.[0],
            latitude: info.coordinate?.[1],
            geoVisitor: withCompare(code, visitors),
          },
        });
      } else {
        setMapSelection(null);
      }
    },
    [playing, visitorDict, setMapSelection, withCompare],
  );

  const handleHover = useCallback(
    (info: PickingInfo) => {
      setIsMapHovered(true);

      const code = (info.object?.id != null ? String(info.object.id) : undefined) as string | undefined;
      const prev = hoveredFeatureRef.current?.geoVisitor.country_code;

      if (!code) {
        setMapSelection({ hovered: undefined });
        return;
      }

      if (code === prev || playing) return;

      const visitors = visitorDict[code] ?? 0;

      setMapSelection({
        hovered: {
          geoVisitor: withCompare(code, visitors),
        },
      });
    },
    [hoveredFeatureRef, playing, setIsMapHovered, setMapSelection, visitorDict, withCompare],
  );

  useEffect(() => {
    if (clickedFeatureRef.current) {
      const country_code = clickedFeatureRef.current.geoVisitor.country_code;
      updateClickedVisitors(visitorDict[country_code] ?? 0, compareVisitorDict[country_code]);
    }
    //! TODO: update hovered here
  }, [playing, frame, visitorDict]);

  return { handleClick, handleHover };
}

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type GeoVisitor = {
  country_code: string;
  visitors: number;
};

export type MapFeatureVisitor = {
  geoVisitor: GeoVisitor;
};

interface MapFeatureSelection {
  hovered?: MapFeatureVisitor;
  clicked?: MapFeatureVisitor;
}

interface MapSelectionContextType {
  hoveredFeature?: MapFeatureVisitor;
  clickedFeature?: MapFeatureVisitor;
  hoveredFeatureRef?: React.RefObject<MapFeatureVisitor | undefined>;
  clickedFeatureRef?: React.RefObject<MapFeatureVisitor | undefined>;
  setMapSelection: React.Dispatch<Partial<MapFeatureSelection> | null>;
}

const DeckGLMapSelectionContext = createContext<MapSelectionContextType | undefined>(undefined);

export function useMapSelection(): MapSelectionContextType {
  const ctx = useContext(DeckGLMapSelectionContext);
  if (!ctx) throw new Error('useMapSelection must be used within DeckGLMapSelectionContextProvider');
  return ctx;
}

export function DeckGLMapSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<MapFeatureSelection>({});

  const hoveredFeatureRef = React.useRef<MapFeatureVisitor | undefined>(undefined);
  const clickedFeatureRef = React.useRef<MapFeatureVisitor | undefined>(undefined);

  const setMapSelection = useCallback<React.Dispatch<Partial<MapFeatureSelection> | null>>((next) => {
    setSelection((prev) => {
      if (next === null) return {};
      if (next.clicked) {
        clickedFeatureRef.current = next.clicked;
        hoveredFeatureRef.current = undefined;
        const same = next.clicked.geoVisitor.country_code === prev.clicked?.geoVisitor.country_code;
        return same
          ? { hovered: { ...next.clicked }, clicked: undefined }
          : { hovered: undefined, clicked: { ...next.clicked } };
      }
      if (prev.clicked) return prev;
      if (prev.hovered?.geoVisitor.country_code === next.hovered?.geoVisitor.country_code) return prev;
      hoveredFeatureRef.current = next.hovered;
      return { ...prev, hovered: next.hovered };
    });
  }, []);

  return (
    <DeckGLMapSelectionContext.Provider
      value={{
        hoveredFeature: selection.hovered,
        clickedFeature: selection.clicked,
        hoveredFeatureRef,
        clickedFeatureRef,
        setMapSelection,
      }}
    >
      {children}
    </DeckGLMapSelectionContext.Provider>
  );
}

// Absolutely! React doesn’t give you a built-in “why did this rerender?” tool in production, but in dev mode there are several reliable ways to trace it. Since you’re dealing with DeckGL + multiple layers, this will help pinpoint exactly which props or state changes are triggering rerenders. Here’s a rundown:

// ---

// ### **1. `React DevTools Profiler` (Recommended)**

// * Open React DevTools → Profiler tab.
// * Click “Record”, interact with your map, then stop recording.
// * You’ll see **which components re-rendered**, how long it took, and why.
// * Hovering over a component shows **why it rendered**: props, state changes, or context.

// ---

// ### **2. `useWhyDidYouUpdate` hook (Custom)**

// You can add a debug hook to log why a component rerenders:

// ```ts
// import { useEffect, useRef } from 'react';

// export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
//   const prevProps = useRef(props);

//   useEffect(() => {
//     const changes: Record<string, { from: any; to: any }> = {};

//     Object.keys(props).forEach((key) => {
//       if (prevProps.current[key] !== props[key]) {
//         changes[key] = { from: prevProps.current[key], to: props[key] };
//       }
//     });

//     if (Object.keys(changes).length) {
//       console.log('[why-did-you-update]', name, changes);
//     }

//     prevProps.current = props;
//   });
// }
// ```

// Usage:

// ```ts
// function DeckGLMap(props: DeckGLMapProps) {
//   useWhyDidYouUpdate('DeckGLMap', props);

//   // ...
// }
// ```

// ---

// ### **3. `React.memo` + `console.log`**

// If a component is wrapped in `React.memo`, you can log when it actually renders:

// ```ts
// const DeckGLStickyTooltip = React.memo((props: DeckGLStickyTooltipProps) => {
//   console.log('DeckGLStickyTooltip render', props);
//   return <Tooltip {...props} />;
// });
// ```

// * This is useful to see repeated renders when props didn’t change.
// * Pair it with the profiler to see what triggered it.

// ---

// ### **4. Track context usage**

// Since you’re using `DeckGLMapSelectionContext`, you can log inside the context provider:

// ```ts
// useEffect(() => {
//   console.log('Selection changed', selection);
// }, [selection]);
// ```

// * This shows whether **hover/click updates** are causing rerenders downstream.
// * If the tooltip jitter corresponds to these logs, it confirms the layer reads the **context state** instead of a **ref**.

// ---

// ### **5. Layer-specific logging**

// For DeckGL layers, you can log every time you recreate them:

// ```ts
// console.log('CountriesLayer created', visitorDict);
// ```

// * Combine with `hoverRef` vs `hoverState` to see if your layer recreates on every hover.
// * Ideally, the layer should **read refs** so hover changes don’t trigger new layer creation.

// ---

// ✅ **Tip:** Since your problem is that **hover updates are triggering full DeckGL rerenders**, logging context changes + using refs for hover/click is the cleanest way to trace and fix jitter.

// ---

// If you want, I can write a **full example of a debug-ready DeckGL setup** with logs in:

// * `DeckGLMap`
// * `CountriesLayer`
// * `DeckGLStickyTooltip`
// * `SelectionContext`

// …so you can literally see each render and what triggered it.

// Do you want me to do that?

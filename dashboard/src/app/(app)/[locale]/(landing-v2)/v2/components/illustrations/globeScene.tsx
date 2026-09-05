'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import createGlobe, { type Marker } from 'cobe';
import { cn } from '@/lib/utils';
import { useInView } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useInView';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import type { IllustrationProps } from './types';

/* Illustration copy is mock data, kept literal on purpose. */
const ARRIVALS = [
  { id: 'cph', city: 'Copenhagen, DK', via: 'via ChatGPT', lat: 55.7, lng: 12.6 },
  { id: 'nyc', city: 'New York, US', via: 'via Google', lat: 40.7, lng: -74.0 },
  { id: 'blr', city: 'Bengaluru, IN', via: 'via Reddit', lat: 13.0, lng: 77.6 },
  { id: 'lon', city: 'London, GB', via: 'via Google', lat: 51.5, lng: -0.1 },
  { id: 'tyo', city: 'Tokyo, JP', via: 'via Perplexity', lat: 35.7, lng: 139.7 },
  { id: 'sao', city: 'São Paulo, BR', via: 'via Direct', lat: -23.5, lng: -46.6 },
  { id: 'syd', city: 'Sydney, AU', via: 'via LinkedIn', lat: -33.9, lng: 151.2 },
  { id: 'ber', city: 'Berlin, DE', via: 'via Google', lat: 52.5, lng: 13.4 },
  { id: 'yto', city: 'Toronto, CA', via: 'via Newsletter', lat: 43.7, lng: -79.4 },
  { id: 'ams', city: 'Amsterdam, NL', via: 'via Hacker News', lat: 52.4, lng: 4.9 },
  { id: 'sin', city: 'Singapore', via: 'via Direct', lat: 1.35, lng: 103.8 },
  { id: 'sfo', city: 'San Francisco, US', via: 'via Claude', lat: 37.8, lng: -122.4 },
  { id: 'par', city: 'Paris, FR', via: 'via Google', lat: 48.9, lng: 2.35 },
  { id: 'los', city: 'Lagos, NG', via: 'via X', lat: 6.5, lng: 3.4 },
  { id: 'mex', city: 'Mexico City, MX', via: 'via Google', lat: 19.4, lng: -99.1 },
  { id: 'waw', city: 'Warsaw, PL', via: 'via GitHub', lat: 52.2, lng: 21.0 },
  { id: 'sel', city: 'Seoul, KR', via: 'via Naver', lat: 37.6, lng: 127.0 },
  { id: 'cpt', city: 'Cape Town, ZA', via: 'via Direct', lat: -33.9, lng: 18.4 },
] as const;

type Arrival = (typeof ARRIVALS)[number];

/* Palette, as 0–1 RGB: the page's text colour for land, --accent-soft for arrivals. */
const LAND: [number, number, number] = [0.6, 0.58, 0.57];
const ARRIVAL: [number, number, number] = [0.545, 0.592, 1];
const GLOW: [number, number, number] = [0.16, 0.15, 0.15];

const ROTATION_PER_FRAME = 0.0022;
const START_PHI = 4.6; // Europe facing the viewer at first paint
const TILT = 0.08; // near level, a touch from above, so the northern arrivals stay in frame
const MARKER = 0.022;
const MARKER_ACTIVE = 0.05;
const DWELL_MS = 3600;
const FACING_CHECK_EVERY = 6; // frames
const MAX_DPR = 2;

function markersFor(activeId: string): Marker[] {
  return ARRIVALS.map((a) => ({
    id: a.id,
    location: [a.lat, a.lng],
    size: a.id === activeId ? MARKER_ACTIVE : MARKER,
  }));
}

/* cobe publishes a --cobe-visible-<id> variable on :root for every marker that
   faces the viewer and drops it for the rest. Its value is unusable in this
   release (a literal "N"), so presence is the signal. */
function isFacing(id: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--cobe-visible-${id}`).trim() !== '';
}

/**
 * The spinning globe: a WebGL sphere of land dots with arrival markers. One
 * arrival at a time is called out with a label anchored to its marker, always
 * picked from the cities currently facing the viewer. The canvas is created
 * here rather than by React because cobe re-parents it into its own wrapper.
 */
export function GlobeScene(_: IllustrationProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  // The globe turns whenever any of it is on screen, not only while its card is the active one.
  const visible = useInView(hostRef, { threshold: 0, rootMargin: '0px', once: false });
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);
  const phiRef = useRef(START_PHI);
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Arrival>(ARRIVALS[0]);
  const activeRef = useRef(active.id);
  const [facing, setFacing] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    host.appendChild(canvas);

    const size = () => ({ width: host.clientWidth, height: host.clientHeight });
    const globe = createGlobe(canvas, {
      ...size(),
      devicePixelRatio: Math.min(MAX_DPR, window.devicePixelRatio || 1),
      phi: phiRef.current,
      theta: TILT,
      dark: 1,
      diffuse: 1.6,
      mapSamples: 18000,
      mapBrightness: 3.2,
      mapBaseBrightness: 0.02,
      baseColor: LAND,
      markerColor: ARRIVAL,
      glowColor: GLOW,
      markers: markersFor(ARRIVALS[0].id),
      markerElevation: 0.01,
    });
    globeRef.current = globe;
    const ro = new ResizeObserver(() => globe.update(size()));
    ro.observe(host);
    return () => {
      ro.disconnect();
      globe.destroy();
      globeRef.current = null;
      host.replaceChildren();
    };
  }, []);

  // Rotation pauses off screen; the last frame stays.
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !visible || reduce) return;
    let raf = 0;
    let n = 0;
    const frame = () => {
      phiRef.current += ROTATION_PER_FRAME;
      globe.update({ phi: phiRef.current });
      if (++n % FACING_CHECK_EVERY === 0) setFacing(isFacing(activeRef.current));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [visible, reduce]);

  // Call out a new arrival every few seconds, choosing one that faces the viewer.
  useEffect(() => {
    if (!visible || reduce) return;
    const next = () => {
      setActive((current) => {
        const start = ARRIVALS.findIndex((a) => a.id === current.id);
        for (let step = 1; step <= ARRIVALS.length; step++) {
          const candidate = ARRIVALS[(start + step) % ARRIVALS.length];
          if (isFacing(candidate.id)) return candidate;
        }
        return current;
      });
    };
    const id = setInterval(next, DWELL_MS);
    return () => clearInterval(id);
  }, [visible, reduce]);

  useEffect(() => {
    activeRef.current = active.id;
    globeRef.current?.update({ markers: markersFor(active.id) });
    setFacing(isFacing(active.id));
  }, [active]);

  const labelStyle = { '--lbl-anchor': `--cobe-${active.id}` } as CSSProperties;

  return (
    <div className='ac'>
      <div ref={hostRef} className='ac__globe' />
      <div className={cn('ac__lbl', facing && 'is-on')} style={labelStyle} aria-hidden>
        <b>{active.city}</b>
        <span>{active.via}</span>
      </div>
    </div>
  );
}

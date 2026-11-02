import { WORLD_GEOJSON_URL } from '@/constants/mapData';
import type { RegionGeoJson } from '@/components/map/types';

export type MapComponents = {
  L: typeof import('leaflet');
  MapContainer: typeof import('react-leaflet').MapContainer;
  GeoJSON: typeof import('react-leaflet').GeoJSON;
  Polygon: typeof import('react-leaflet').Polygon;
  Rectangle: typeof import('react-leaflet').Rectangle;
  Marker: typeof import('react-leaflet').Marker;
};

// Module cache so a remounted map skips its loader
let loadedMapComponents: MapComponents | null = null;
let loadedWorldGeoJson: RegionGeoJson | null = null;
let mapComponentsPromise: Promise<MapComponents> | null = null;
let worldGeoJsonPromise: Promise<RegionGeoJson> | null = null;

export const getLoadedMapComponents = () => loadedMapComponents;
export const getLoadedWorldGeoJson = () => loadedWorldGeoJson;

export async function fetchGeoJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url} (${res.status})`);
  }
  return res.json();
}

export function loadMapComponents(): Promise<MapComponents> {
  mapComponentsPromise ??= Promise.all([import('leaflet'), import('react-leaflet')])
    .then(([leaflet, reactLeaflet]) => {
      loadedMapComponents = {
        L: leaflet.default,
        MapContainer: reactLeaflet.MapContainer,
        GeoJSON: reactLeaflet.GeoJSON,
        Polygon: reactLeaflet.Polygon,
        Rectangle: reactLeaflet.Rectangle,
        Marker: reactLeaflet.Marker,
      };
      return loadedMapComponents;
    })
    .catch((error) => {
      mapComponentsPromise = null;
      throw error;
    });
  return mapComponentsPromise;
}

export function loadWorldGeoJson(): Promise<RegionGeoJson> {
  worldGeoJsonPromise ??= fetchGeoJson<RegionGeoJson>(WORLD_GEOJSON_URL)
    .then((geoJson) => {
      loadedWorldGeoJson = geoJson;
      return geoJson;
    })
    .catch((error) => {
      worldGeoJsonPromise = null;
      throw error;
    });
  return worldGeoJsonPromise;
}

import type { LatLng, LatLngLiteral, Polygon } from 'leaflet';

type Ring = LatLng[];
type Box = { minLat: number; maxLat: number; minLng: number; maxLng: number };

function outerRings(latlngs: LatLng[] | LatLng[][] | LatLng[][][]): Ring[] {
  const first = latlngs[0];
  if (!first || !Array.isArray(first)) return [latlngs as Ring];
  if (!Array.isArray(first[0])) return [first as Ring];
  return (latlngs as LatLng[][][]).map((polygon) => polygon[0]);
}

function boxOf(ring: Ring): Box {
  return ring.reduce(
    (box, point) => ({
      minLat: Math.min(box.minLat, point.lat),
      maxLat: Math.max(box.maxLat, point.lat),
      minLng: Math.min(box.minLng, point.lng),
      maxLng: Math.max(box.maxLng, point.lng),
    }),
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity },
  );
}

const area = (box: Box) => (box.maxLat - box.minLat) * (box.maxLng - box.minLng);

// Leaflet anchors a popup on the first ring, which is Hawaii for the US and Corsica for France
export function largestRingCenter(layer: Pick<Polygon, 'getLatLngs'>): LatLngLiteral | undefined {
  const boxes = outerRings(layer.getLatLngs())
    .filter((ring) => ring.length > 0)
    .map(boxOf);
  if (boxes.length === 0) return undefined;
  const largest = boxes.reduce((best, box) => (area(box) > area(best) ? box : best));
  return { lat: (largest.minLat + largest.maxLat) / 2, lng: (largest.minLng + largest.maxLng) / 2 };
}

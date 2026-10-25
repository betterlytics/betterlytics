export type Bbox = [minLon: number, minLat: number, maxLon: number, maxLat: number];

export const bboxToLatLngs = ([minLon, minLat, maxLon, maxLat]: Bbox): [[number, number], [number, number]] => [
  [minLat, minLon],
  [maxLat, maxLon],
];

export function bboxOf(geometry: GeoJSON.Geometry): Bbox {
  const rings =
    geometry.type === 'Polygon'
      ? geometry.coordinates
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates.flat()
        : [];
  return rings
    .flat()
    .reduce<Bbox>(
      ([minLon, minLat, maxLon, maxLat], [lon, lat]) => [
        Math.min(minLon, lon),
        Math.min(minLat, lat),
        Math.max(maxLon, lon),
        Math.max(maxLat, lat),
      ],
      [Infinity, Infinity, -Infinity, -Infinity],
    );
}

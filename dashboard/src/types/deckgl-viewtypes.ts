import { LinearInterpolator, type MapViewState } from '@deck.gl/core';

export const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 20,
  pitch: 0,
  bearing: 0,
  zoom: 1.5,
} as const;

export const ZOOM_TYPES = ['in', 'out'] as const;
export type ZoomType = (typeof ZOOM_TYPES)[number];
export const isZoomType = (value: any): value is ZoomType => ZOOM_TYPES.includes(value);

export type MapCommandResolvers = {
  zoom: (zoomType: ZoomType, prev: MapViewState) => MapViewState;
};

export type MapUpdateHandler = (cmd: MapCommand, args: any) => void;
export type MapCommand = keyof MapCommandResolvers;
export type MapRunCommand = <K extends MapCommand>(cmd: K, args: Parameters<MapCommandResolvers[K]>[0]) => void;

export const MAP_COMMAND_RESOLVERS: MapCommandResolvers = {
  zoom: (zoomType, prev) => ({
    ...prev,
    transitionDuration: 200,
    transitionInterpolator: new LinearInterpolator(['zoom']),
    zoom: prev.zoom + (zoomType === 'in' ? 1 : -1),
  }),
};

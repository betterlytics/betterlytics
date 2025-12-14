// ============================================
// TYPES
// ============================================

export interface NodePosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  totalTraffic: number;
}

export interface LinkPosition {
  index: number;
  source: NodePosition;
  target: NodePosition;
  value: number;
  sourceY: number;
  targetY: number;
  sourceWidth: number;
  targetWidth: number;
  width: number;
}

export interface HighlightState {
  nodeIds: Set<string>;
  linkIndices: Set<number>;
}

import { LAYOUT } from './constants';

const DIVIDER_GAP = 8;

export type StepBandCell = {
  left: number;
  width: number;
};

export function getStepBandCells(cellCount: number, alignToColumns: boolean): StepBandCell[] {
  const boundaries = alignToColumns ? getAlignedBoundaries(cellCount) : getEqualBoundaries(cellCount);
  return boundaries.slice(0, -1).map((left, index) => ({ left, width: boundaries[index + 1] - left }));
}

function getEqualBoundaries(cellCount: number): number[] {
  return Array.from({ length: cellCount + 1 }, (_, index) => index / cellCount);
}

function getAlignedBoundaries(cellCount: number): number[] {
  if (cellCount <= 1) return [0, 1];
  const { chartWidth, labelMargin, padding, nodeWidth } = LAYOUT;
  const availableWidth = chartWidth - padding.left - padding.right - nodeWidth - labelMargin;
  const depthSpacing = availableWidth / (cellCount - 1);
  const inner = Array.from(
    { length: cellCount - 1 },
    (_, index) => (padding.left + (index + 1) * depthSpacing - DIVIDER_GAP) / chartWidth,
  );
  return [0, ...inner, 1];
}

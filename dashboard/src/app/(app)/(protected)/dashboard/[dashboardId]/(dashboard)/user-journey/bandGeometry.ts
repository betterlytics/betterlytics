import { LAYOUT } from './constants';

const VIEWBOX_WIDTH = 900;
const COLUMN_GAP = 8;

export type StepBandCell = { left: number; width: number };

/**
 * Cell boundaries mirror the chart's own column math (createLayoutConfig) as
 * percentages of the shared container, so dividers land just left of each
 * sankey column at any rendered width.
 */
export function getStepBandCells(numberOfSteps: number): StepBandCell[] {
  const { padding, nodeWidth, labelMargin } = LAYOUT;
  const columns = numberOfSteps + 1;
  const availableWidth = VIEWBOX_WIDTH - padding.left - padding.right - nodeWidth - labelMargin;
  const depthSpacing = numberOfSteps > 0 ? availableWidth / numberOfSteps : 0;

  const boundary = (index: number) => {
    if (index <= 0) return 0;
    if (index >= columns) return 100;
    return ((padding.left + index * depthSpacing - COLUMN_GAP) / VIEWBOX_WIDTH) * 100;
  };

  return Array.from({ length: columns }, (_, index) => {
    const left = boundary(index);
    return { left, width: boundary(index + 1) - left };
  });
}

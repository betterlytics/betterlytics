import { LAYOUT } from './constants';

const VIEWBOX_WIDTH = 900;
const COLUMN_GAP = 8;

export type StepBandCell = { left: number; width: number };

/**
 * Cell boundaries mirror the chart's steps-driven column grid
 * (createLayoutConfig divides the available width by numberOfSteps - 1)
 * as percentages of the shared container, so dividers land just left of
 * each column position regardless of how deep the data renders.
 */
export function getStepBandCells(numberOfSteps: number): StepBandCell[] {
  const { padding, nodeWidth, labelMargin } = LAYOUT;
  const availableWidth = VIEWBOX_WIDTH - padding.left - padding.right - nodeWidth - labelMargin;
  const depthSpacing = numberOfSteps > 1 ? availableWidth / (numberOfSteps - 1) : 0;

  const boundary = (index: number) => {
    if (index <= 0) return 0;
    if (index >= numberOfSteps) return 100;
    return ((padding.left + index * depthSpacing - COLUMN_GAP) / VIEWBOX_WIDTH) * 100;
  };

  return Array.from({ length: numberOfSteps }, (_, index) => {
    const left = boundary(index);
    return { left, width: boundary(index + 1) - left };
  });
}

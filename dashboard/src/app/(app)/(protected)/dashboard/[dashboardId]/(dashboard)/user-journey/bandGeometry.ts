import { LAYOUT } from './constants';

const VIEWBOX_WIDTH = 900;

export type StepBandCell = { left: number; width: number };

/**
 * Cell boundaries mirror the chart's steps-driven column grid
 * (createLayoutConfig divides the available width by numberOfSteps - 1)
 * as percentages of the shared container, so boundaries land exactly on
 * each column position. The band renders a leading spacer covering the
 * sub-padding.left strip before the first cell.
 */
export function getStepBandCells(numberOfSteps: number): StepBandCell[] {
  const { padding, nodeWidth, labelMargin } = LAYOUT;
  const availableWidth = VIEWBOX_WIDTH - padding.left - padding.right - nodeWidth - labelMargin;
  const depthSpacing = numberOfSteps > 1 ? availableWidth / (numberOfSteps - 1) : 0;

  const boundary = (index: number) => {
    if (index <= 0) return (padding.left / VIEWBOX_WIDTH) * 100;
    if (index >= numberOfSteps) return 100;
    return ((padding.left + index * depthSpacing) / VIEWBOX_WIDTH) * 100;
  };

  return Array.from({ length: numberOfSteps }, (_, index) => {
    const left = boundary(index);
    return { left, width: boundary(index + 1) - left };
  });
}

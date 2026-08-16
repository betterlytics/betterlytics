import { CHART_VIEWBOX_WIDTH } from './constants';
import { getDepthGrid } from './layoutCalculation';

export type StepBandCell = { left: number; width: number };

/**
 * Cell boundaries come from the chart's own grid helper (getDepthGrid), as
 * percentages of the shared container, so boundaries land exactly on each
 * column position. The band renders a leading spacer covering the
 * sub-padding.left strip before the first cell.
 */
export function getStepBandCells(numberOfSteps: number): StepBandCell[] {
  const { columnX } = getDepthGrid(CHART_VIEWBOX_WIDTH, numberOfSteps);

  const boundary = (index: number) => {
    if (index >= numberOfSteps) return 100;
    return (columnX(index) / CHART_VIEWBOX_WIDTH) * 100;
  };

  return Array.from({ length: numberOfSteps }, (_, index) => {
    const left = boundary(index);
    return { left, width: boundary(index + 1) - left };
  });
}

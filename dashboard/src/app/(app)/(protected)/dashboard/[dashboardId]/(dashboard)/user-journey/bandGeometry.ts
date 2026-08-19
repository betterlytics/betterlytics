import { CHART_VIEWBOX_WIDTH, LAYOUT } from './constants';
import { getDepthGrid } from './layoutCalculation';

export type StepBandCell = { left: number; width: number };
export type StepBandGeometry = { left: number; width: number; cells: StepBandCell[] };

/**
 * The band box spans the chart's horizontal content extent: from the first
 * column position (getDepthGrid) to the right edge of the last column's label
 * area (viewbox width minus right padding), as percentages of the shared
 * container. Cell boundaries are percentages of the band box itself, so they
 * land exactly on each column position.
 */
export function getStepBandGeometry(numberOfSteps: number): StepBandGeometry {
  const { columnX } = getDepthGrid(CHART_VIEWBOX_WIDTH, numberOfSteps);
  const bandLeft = columnX(0);
  const bandWidth = CHART_VIEWBOX_WIDTH - LAYOUT.padding.right - bandLeft;

  const boundary = (index: number) => {
    if (index >= numberOfSteps) return 100;
    return ((columnX(index) - bandLeft) / bandWidth) * 100;
  };

  const cells = Array.from({ length: numberOfSteps }, (_, index) => {
    const left = boundary(index);
    return { left, width: boundary(index + 1) - left };
  });

  return {
    left: (bandLeft / CHART_VIEWBOX_WIDTH) * 100,
    width: (bandWidth / CHART_VIEWBOX_WIDTH) * 100,
    cells,
  };
}

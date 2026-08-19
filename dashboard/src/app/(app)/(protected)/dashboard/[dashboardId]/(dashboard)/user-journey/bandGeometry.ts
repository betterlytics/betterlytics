import { CHART_VIEWBOX_WIDTH } from './constants';
import { getDepthGrid } from './layoutCalculation';

export type StepBandCell = { left: number; width: number };
export type StepBandGeometry = { left: number; width: number; cells: StepBandCell[] };

/**
 * The band box starts at the first column position (getDepthGrid) and runs to
 * the container's right edge, aligning with the controls above the chart, as
 * percentages of the shared container. Cell boundaries are percentages of the
 * band box itself, so they land exactly on each column position.
 */
export function getStepBandGeometry(numberOfSteps: number): StepBandGeometry {
  const { columnX } = getDepthGrid(CHART_VIEWBOX_WIDTH, numberOfSteps);
  const bandLeft = columnX(0);
  const bandWidth = CHART_VIEWBOX_WIDTH - bandLeft;

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

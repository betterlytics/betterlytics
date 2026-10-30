export type ConvergenceStep = 'ignore' | 'keep' | 'clear' | 'select';

// undefined leaves the map uncontrolled; null is a controlled map with nothing selected
export function planConvergence(
  selectedFeatureId: string | null | undefined,
  clickedLayer: unknown,
  entryLayer: unknown,
  layersReady: boolean,
): ConvergenceStep {
  if (selectedFeatureId === undefined) return 'ignore';
  if (selectedFeatureId === null) return clickedLayer ? 'clear' : 'keep';
  // Once layers exist, a selection without one (no world shape, hidden when empty) leaves nothing highlighted
  if (!entryLayer) return layersReady && clickedLayer ? 'clear' : 'keep';
  return clickedLayer === entryLayer ? 'keep' : 'select';
}

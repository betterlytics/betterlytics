export type ConvergenceStep = 'ignore' | 'keep' | 'clear' | 'select';

// undefined leaves the map uncontrolled; null is a controlled map with nothing selected
export function planConvergence(
  selectedFeatureId: string | null | undefined,
  clickedLayer: unknown,
  entryLayer: unknown,
): ConvergenceStep {
  if (selectedFeatureId === undefined) return 'ignore';
  if (selectedFeatureId === null) return clickedLayer ? 'clear' : 'keep';
  if (!entryLayer) return 'keep';
  return clickedLayer === entryLayer ? 'keep' : 'select';
}

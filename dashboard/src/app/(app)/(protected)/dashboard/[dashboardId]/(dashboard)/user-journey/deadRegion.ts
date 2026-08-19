/**
 * The slot whose filters matched no journeys: the first column after the
 * deepest rendered one, when that column carries active filters. Blank
 * columns without filters mean journeys simply end there, and filters on
 * later blank columns are moot rather than failing.
 */
export function getFailingSlot(
  nodes: ReadonlyArray<{ depth: number }>,
  filteredSlots: ReadonlyArray<number>,
  numberOfSteps: number,
): number | null {
  if (nodes.length === 0) return null;
  const maxDepth = Math.max(...nodes.map((node) => node.depth));
  const firstBlankSlot = maxDepth + 1;
  if (firstBlankSlot >= numberOfSteps) return null;
  return filteredSlots.includes(firstBlankSlot) ? firstBlankSlot : null;
}

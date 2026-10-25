import { describe, expect, it } from 'vitest';
import { planConvergence } from '@/components/map/selection-convergence';

const layerA = { id: 'a' };
const layerB = { id: 'b' };

describe('planConvergence', () => {
  it('ignores uncontrolled maps even when a feature is clicked', () => {
    expect(planConvergence(undefined, layerA, undefined)).toBe('ignore');
    expect(planConvergence(undefined, undefined, undefined)).toBe('ignore');
  });

  it('clears a click when the controlled selection is empty', () => {
    expect(planConvergence(null, layerA, undefined)).toBe('clear');
    expect(planConvergence(null, undefined, undefined)).toBe('keep');
  });

  it('waits for the layer when the selected feature is not registered yet', () => {
    expect(planConvergence('US', layerA, undefined)).toBe('keep');
  });

  it('selects the registered layer unless it is already the clicked one', () => {
    expect(planConvergence('US', undefined, layerA)).toBe('select');
    expect(planConvergence('US', layerB, layerA)).toBe('select');
    expect(planConvergence('US', layerA, layerA)).toBe('keep');
  });
});

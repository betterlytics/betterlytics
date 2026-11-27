import { describe, expect, it } from 'vitest';
import { planConvergence } from '@/components/map/selection-convergence';

const layerA = { id: 'a' };
const layerB = { id: 'b' };

describe('planConvergence', () => {
  it('ignores uncontrolled maps even when a feature is clicked', () => {
    expect(planConvergence(undefined, layerA, undefined, true)).toBe('ignore');
    expect(planConvergence(undefined, undefined, undefined, true)).toBe('ignore');
  });

  it('clears a click when the controlled selection is empty', () => {
    expect(planConvergence(null, layerA, undefined, true)).toBe('clear');
    expect(planConvergence(null, undefined, undefined, true)).toBe('keep');
  });

  it('waits for the layer when the selected feature is not registered yet', () => {
    expect(planConvergence('US', layerA, undefined, false)).toBe('keep');
  });

  it('clears the clicked layer once layers exist and the selected feature has none', () => {
    expect(planConvergence('SG', layerA, undefined, true)).toBe('clear');
    expect(planConvergence('SG', undefined, undefined, true)).toBe('keep');
  });

  it('selects the registered layer unless it is already the clicked one', () => {
    expect(planConvergence('US', undefined, layerA, true)).toBe('select');
    expect(planConvergence('US', layerB, layerA, true)).toBe('select');
    expect(planConvergence('US', layerA, layerA, true)).toBe('keep');
  });
});

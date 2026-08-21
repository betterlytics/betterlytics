import { describe, it, expect } from 'vitest';
import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { createSankeyGraph, remapHighlightState } from './SankeyGraph';

const node = (id: string, depth: number) => ({ id, name: `/${id}`, depth, totalTraffic: 10 });

const twoPaths: SankeyData = {
  nodes: [node('c_0', 0), node('d_1', 1), node('a_0', 0), node('b_1', 1)],
  links: [
    { source: 0, target: 1, value: 5 },
    { source: 2, target: 3, value: 5 },
  ],
};

describe('remapHighlightState', () => {
  it('remaps a surviving lock onto the new link indices', () => {
    const fromGraph = createSankeyGraph(twoPaths);
    const lock = fromGraph.findConnectedFromNode('a_0');
    expect(Array.from(lock.linkIndices)).toEqual([1]);

    const toGraph = createSankeyGraph({
      nodes: [node('a_0', 0), node('b_1', 1)],
      links: [{ source: 0, target: 1, value: 5 }],
    });
    const remapped = remapHighlightState(lock, fromGraph, toGraph);

    expect(remapped).not.toBeNull();
    expect(Array.from(remapped!.nodeIds).sort()).toEqual(['a_0', 'b_1']);
    expect(Array.from(remapped!.linkIndices)).toEqual([0]);
  });

  it('returns null when a locked node was removed', () => {
    const fromGraph = createSankeyGraph(twoPaths);
    const lock = fromGraph.findConnectedFromNode('a_0');

    const toGraph = createSankeyGraph({
      nodes: [node('c_0', 0), node('d_1', 1), node('a_0', 0)],
      links: [{ source: 0, target: 1, value: 5 }],
    });

    expect(remapHighlightState(lock, fromGraph, toGraph)).toBeNull();
  });

  it('returns null when the locked link is gone even though both nodes remain', () => {
    const fromGraph = createSankeyGraph(twoPaths);
    const lock = fromGraph.findConnectedFromNode('a_0');

    const toGraph = createSankeyGraph({
      nodes: [node('a_0', 0), node('b_1', 1), node('e_1', 1), node('x_0', 0)],
      links: [
        { source: 0, target: 2, value: 5 },
        { source: 3, target: 1, value: 5 },
      ],
    });

    expect(remapHighlightState(lock, fromGraph, toGraph)).toBeNull();
  });
});

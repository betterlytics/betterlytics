'server-only';

import { getUserJourneyTransitions } from '@/repositories/clickhouse/userJourney.repository';
import { SankeyData, SankeyNode, SankeyLink, JourneyTransition } from '@/entities/analytics/userJourney.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getUserJourneyForSankeyDiagram(
  siteQuery: BASiteQuery,
  maxSteps: number = 3,
  limit: number = 50,
): Promise<SankeyData> {
  const maxPathLength = Math.max(2, maxSteps + 1);

  const transitions = await getUserJourneyTransitions(siteQuery, maxPathLength, limit);

  return buildSankeyFromTransitions(transitions);
}

function buildSankeyFromTransitions(transitions: JourneyTransition[]): SankeyData {
  const nodeMap = new Map<string, number>(); // nodeId -> index
  const nodes: SankeyNode[] = [];
  const linkMap = new Map<string, number>(); // 'sourceIndex|targetIndex' -> value

  const nodeIncomingTrafficMap = new Map<number, number>(); // nodeIndex -> incoming
  const nodeOutgoingTrafficMap = new Map<number, number>(); // nodeIndex -> outgoing

  transitions.forEach(({ source, target, source_depth, target_depth, value }) => {
    const sourceId = `${source}_${source_depth}`;
    const targetId = `${target}_${target_depth}`;

    let sourceIndex = nodeMap.get(sourceId);
    if (sourceIndex === undefined) {
      sourceIndex = nodes.length;
      nodeMap.set(sourceId, sourceIndex);
      nodes.push({
        id: sourceId,
        name: source,
        depth: source_depth,
        totalTraffic: 0,
      });
      nodeIncomingTrafficMap.set(sourceIndex, 0);
      nodeOutgoingTrafficMap.set(sourceIndex, 0);
    }

    let targetIndex = nodeMap.get(targetId);
    if (targetIndex === undefined) {
      targetIndex = nodes.length;
      nodeMap.set(targetId, targetIndex);
      nodes.push({
        id: targetId,
        name: target,
        depth: target_depth,
        totalTraffic: 0,
      });
      nodeIncomingTrafficMap.set(targetIndex, 0);
      nodeOutgoingTrafficMap.set(targetIndex, 0);
    }

    const linkId = `${sourceIndex}|${targetIndex}`;
    linkMap.set(linkId, (linkMap.get(linkId) || 0) + value);

    nodeIncomingTrafficMap.set(targetIndex, (nodeIncomingTrafficMap.get(targetIndex) || 0) + value);
    nodeOutgoingTrafficMap.set(sourceIndex, (nodeOutgoingTrafficMap.get(sourceIndex) || 0) + value);
  });

  nodes.forEach((node, index) => {
    const traffic =
      node.depth === 0 ? nodeOutgoingTrafficMap.get(index) || 0 : nodeIncomingTrafficMap.get(index) || 0;
    node.totalTraffic = traffic;
  });

  const links: SankeyLink[] = Array.from(linkMap.entries()).map(([linkId, value]): SankeyLink => {
    const [source, target] = linkId.split('|').map(Number);
    return { source, target, value };
  });

  return { nodes, links };
}

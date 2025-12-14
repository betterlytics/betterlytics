'server-only';

import { getUserJourneyTransitions } from '@/repositories/clickhouse/userJourney.repository';
import { SankeyData, SankeyNode, SankeyLink, JourneyTransition } from '@/entities/analytics/userJourney.entities';
import { toDateTimeString } from '@/utils/dateFormatters';
import { QueryFilter } from '@/entities/analytics/filter.entities';

/**
 * Fetches user journey data and transforms it into Sankey diagram format
 * using pre-aggregated transitions from ClickHouse.
 */
export async function getUserJourneyForSankeyDiagram(
  siteId: string,
  startDate: Date,
  endDate: Date,
  maxSteps: number = 3,
  limit: number = 50,
  queryFilters: QueryFilter[],
): Promise<SankeyData> {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  const transitions = await getUserJourneyTransitions(
    siteId,
    formattedStart,
    formattedEnd,
    maxSteps,
    limit,
    queryFilters,
  );

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

    // Source node
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

    // Target node
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

    // Link aggregation
    const linkId = `${sourceIndex}|${targetIndex}`;
    linkMap.set(linkId, (linkMap.get(linkId) || 0) + value);

    // Traffic bookkeeping
    nodeIncomingTrafficMap.set(targetIndex, (nodeIncomingTrafficMap.get(targetIndex) || 0) + value);
    nodeOutgoingTrafficMap.set(sourceIndex, (nodeOutgoingTrafficMap.get(sourceIndex) || 0) + value);
  });

  // Finalize node traffic
  nodes.forEach((node, index) => {
    if (node.depth === 0) {
      node.totalTraffic = nodeOutgoingTrafficMap.get(index) || 0;
    } else {
      node.totalTraffic = nodeIncomingTrafficMap.get(index) || 0;
    }
  });

  const links: SankeyLink[] = Array.from(linkMap.entries()).map(([linkId, value]): SankeyLink => {
    const [source, target] = linkId.split('|').map(Number);
    return { source, target, value };
  });

  return { nodes, links };
}

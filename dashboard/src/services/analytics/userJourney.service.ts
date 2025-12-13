'server-only';

import { getUserSequentialPaths } from '@/repositories/clickhouse/userJourney.repository';
import { SankeyData, SankeyNode, SankeyLink, SequentialPath } from '@/entities/analytics/userJourney.entities';
import { toDateTimeString } from '@/utils/dateFormatters';
import { QueryFilter } from '@/entities/analytics/filter.entities';

/**
 * Fetches user journey data and transforms it into Sankey diagram format
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

  const sequentialPaths = await getUserSequentialPaths(
    siteId,
    formattedStart,
    formattedEnd,
    maxSteps,
    limit,
    queryFilters,
  );

  return transformSequentialPathsToSankeyData(sequentialPaths, maxSteps);
}

/**
 * Transforms sequential journey data into Sankey format
 */
function transformSequentialPathsToSankeyData(
  sequentialPaths: SequentialPath[],
  maxSteps: number = 3,
): SankeyData {
  // Track unique nodes and their indices
  const nodeMap = new Map<string, number>(); // nodeId -> index
  const nodes: SankeyNode[] = [];

  // Track links and their values
  const linkMap = new Map<string, number>(); // linkId key is formatted as 'sourceIndex|targetIndex'

  const nodeIncomingTrafficMap = new Map<number, number>(); // nodeIndex -> incoming traffic count
  const nodeOutgoingTrafficMap = new Map<number, number>(); // nodeIndex -> outgoing traffic count

  // Process each user journey path from each session
  sequentialPaths.forEach(({ path, count }) => {
    // Limit to maxSteps nodes
    const limitedPath = path.slice(0, maxSteps);

    // Process each step in the path
    for (let i = 0; i < limitedPath.length - 1; i++) {
      const currentPage = limitedPath[i];
      const nextPage = limitedPath[i + 1];

      // Create unique node IDs based on page and position
      const sourceId = `${currentPage}_${i}`;
      const targetId = `${nextPage}_${i + 1}`;

      // Get or create source node index
      let sourceIndex = nodeMap.get(sourceId);
      if (sourceIndex === undefined) {
        sourceIndex = nodes.length;
        nodeMap.set(sourceId, sourceIndex);
        nodes.push({
          id: sourceId,
          name: currentPage,
          depth: i,
          totalTraffic: 0,
        });
        nodeIncomingTrafficMap.set(sourceIndex, 0);
        nodeOutgoingTrafficMap.set(sourceIndex, 0);
      }

      // Get or create target node index
      let targetIndex = nodeMap.get(targetId);
      if (targetIndex === undefined) {
        targetIndex = nodes.length;
        nodeMap.set(targetId, targetIndex);
        nodes.push({
          id: targetId,
          name: nextPage,
          depth: i + 1,
          totalTraffic: 0,
        });
        nodeIncomingTrafficMap.set(targetIndex, 0);
        nodeOutgoingTrafficMap.set(targetIndex, 0);
      }

      // Create or update link counter
      const linkId = `${sourceIndex}|${targetIndex}`;
      linkMap.set(linkId, (linkMap.get(linkId) || 0) + count);

      // Update traffic counts
      nodeIncomingTrafficMap.set(targetIndex, (nodeIncomingTrafficMap.get(targetIndex) || 0) + count);
      nodeOutgoingTrafficMap.set(sourceIndex, (nodeOutgoingTrafficMap.get(sourceIndex) || 0) + count);
    }
  });

  // Assign total traffic to each node based on its position
  nodes.forEach((node, index) => {
    if (node.depth === 0) {
      // Root nodes: use outgoing traffic as total traffic
      node.totalTraffic = nodeOutgoingTrafficMap.get(index) || 0;
    } else {
      // Non-root nodes: use incoming traffic as total traffic
      node.totalTraffic = nodeIncomingTrafficMap.get(index) || 0;
    }
  });

  // Convert link map to SankeyLinks
  const links: SankeyLink[] = Array.from(linkMap.entries()).map(([linkId, value]): SankeyLink => {
    const [source, target] = linkId.split('|').map(Number);
    return { source, target, value };
  });

  return { nodes, links };
}

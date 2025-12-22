import { NodePosition, LinkPosition } from './types';
import { LAYOUT } from './constants';
import { SankeyGraph, GraphNode, GraphLink, NodeConnection } from './SankeyGraph';

export interface LayoutResult {
  nodePositions: NodePosition[];
  linkPositions: LinkPosition[];
}

interface LayoutConfig {
  availableWidth: number;
  availableHeight: number;
  depthSpacing: number;
  heightScale: number;
  paddingTop: number;
  paddingLeft: number;
  nodeWidth: number;
  minNodeHeight: number;
  compressionThreshold: number;
  maxNodeHeight: number;
}

/**
 * Main layout calculation - orchestrates the layout pipeline
 */
export function calculateLayout(graph: SankeyGraph, width: number, height: number): LayoutResult {
  if (graph.isEmpty) {
    return { nodePositions: [], linkPositions: [] };
  }

  const config = createLayoutConfig(graph, width, height);
  const orderedGroups = applyBarycenterOrdering(graph, config);
  const { nodePositions, nodePositionMap } = calculateNodePositions(orderedGroups, config);
  const linkPositions = calculateLinkPositions(graph, nodePositions, nodePositionMap, config);

  return { nodePositions, linkPositions };
}

/**
 * Create layout configuration from graph metrics and dimensions
 */
function createLayoutConfig(graph: SankeyGraph, width: number, height: number): LayoutConfig {
  const { padding, nodeWidth, minNodeHeight, compressionThreshold, maxNodeHeight } = LAYOUT;
  const labelMargin = 110;

  const availableWidth = Math.max(0, width - padding.left - padding.right - nodeWidth - labelMargin);
  const availableHeight = height - padding.top - padding.bottom;
  const depthSpacing = graph.maxDepth > 0 ? availableWidth / graph.maxDepth : 0;

  const heightScale = maxNodeHeight / graph.maxTraffic;

  return {
    availableWidth,
    availableHeight,
    depthSpacing,
    heightScale,
    paddingTop: padding.top,
    paddingLeft: padding.left,
    nodeWidth,
    minNodeHeight,
    compressionThreshold,
    maxNodeHeight,
  };
}

/**
 * Apply soft compression to node height.
 * Linear scaling up to threshold, then sqrt compression up to max.
 * This prevents huge nodes while keeping large values visually distinct.
 */
function compressHeight(rawHeight: number, config: LayoutConfig): number {
  const { minNodeHeight, compressionThreshold, maxNodeHeight } = config;

  if (rawHeight <= compressionThreshold) {
    // Below threshold: linear scaling (unchanged)
    return Math.max(minNodeHeight, rawHeight);
  }

  // The excess above threshold gets compressed via sqrt
  const excess = rawHeight - compressionThreshold;
  const compressionRange = maxNodeHeight - compressionThreshold;

  // Normalize excess to [0, 1] range (assuming excess won't exceed 4x the threshold typically)
  // Then apply sqrt and scale to remaining range
  const normalizedExcess = Math.min(excess / (compressionThreshold * 4), 1);
  const compressedExcess = Math.sqrt(normalizedExcess) * compressionRange;

  return Math.min(compressionThreshold + compressedExcess, maxNodeHeight);
}

/**
 * Apply barycenter ordering to minimize link crossings
 */
function applyBarycenterOrdering(graph: SankeyGraph, config: LayoutConfig): Map<number, GraphNode[]> {
  const orderedGroups = new Map<number, GraphNode[]>();
  graph.depthGroups.forEach((nodes, depth) => {
    orderedGroups.set(depth, [...nodes]);
  });

  const nodeYCenter = new Map<string, number>();
  const ITERATIONS = 6;

  // Initial Y positions
  for (let depth = 0; depth <= graph.maxDepth; depth++) {
    updateColumnYCenters(orderedGroups.get(depth) || [], nodeYCenter, config);
  }

  // Iterative barycenter refinement
  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Forward pass: order by incoming connections
    for (let depth = 1; depth <= graph.maxDepth; depth++) {
      const nodes = orderedGroups.get(depth) || [];
      const sorted = sortByBarycenter(nodes, nodeYCenter, (n) => n.incoming, graph.maxTraffic);
      orderedGroups.set(depth, sorted);
      updateColumnYCenters(sorted, nodeYCenter, config);
    }

    // Backward pass: order by outgoing connections
    for (let depth = graph.maxDepth - 1; depth >= 0; depth--) {
      const nodes = orderedGroups.get(depth) || [];
      const sorted = sortByBarycenter(nodes, nodeYCenter, (n) => n.outgoing, graph.maxTraffic);
      orderedGroups.set(depth, sorted);
      updateColumnYCenters(sorted, nodeYCenter, config);
    }
  }

  return orderedGroups;
}

/**
 * Sort nodes by their barycenter (weighted average Y of connected nodes)
 * with a size bias heuristic that pushes larger nodes toward the top
 */
function sortByBarycenter(
  nodes: GraphNode[],
  nodeYCenter: Map<string, number>,
  getConnections: (node: GraphNode) => NodeConnection[],
  maxTraffic: number,
): GraphNode[] {
  const SIZE_BIAS_WEIGHT = 100;

  const withBarycenters = nodes.map((node) => {
    const connections = getConnections(node);
    let rawBarycenter: number;

    if (connections.length === 0) {
      rawBarycenter = nodeYCenter.get(node.id) || 0;
    } else {
      let weightedSum = 0;
      let totalWeight = 0;
      connections.forEach(({ nodeId, value }) => {
        weightedSum += (nodeYCenter.get(nodeId) || 0) * value;
        totalWeight += value;
      });
      rawBarycenter = totalWeight > 0 ? weightedSum / totalWeight : nodeYCenter.get(node.id) || 0;
    }

    const sizeRatio = maxTraffic > 0 ? node.totalTraffic / maxTraffic : 0;
    const sizeBias = (1 - sizeRatio) * SIZE_BIAS_WEIGHT;

    return {
      node,
      barycenter: rawBarycenter + sizeBias,
    };
  });

  withBarycenters.sort((a, b) => a.barycenter - b.barycenter);
  return withBarycenters.map((b) => b.node);
}

/**
 * Update Y center positions for a column of nodes
 */
function updateColumnYCenters(nodes: GraphNode[], nodeYCenter: Map<string, number>, config: LayoutConfig): void {
  const heights = nodes.map((node) => compressHeight(node.totalTraffic * config.heightScale, config));
  const totalHeight = heights.reduce((sum, h) => sum + h, 0);
  const remainingSpace = config.availableHeight - totalHeight;
  const padding = nodes.length > 1 ? Math.max(0, remainingSpace / (nodes.length - 1)) : 0;

  let y = config.paddingTop;
  nodes.forEach((node, i) => {
    const height = heights[i];
    nodeYCenter.set(node.id, y + height / 2);
    y += height + padding;
  });
}

/**
 * Calculate final node positions
 */
function calculateNodePositions(
  orderedGroups: Map<number, GraphNode[]>,
  config: LayoutConfig,
): { nodePositions: NodePosition[]; nodePositionMap: Map<string, NodePosition> } {
  const nodePositions: NodePosition[] = [];
  const nodePositionMap = new Map<string, NodePosition>();

  orderedGroups.forEach((nodes, depth) => {
    const x = config.paddingLeft + depth * config.depthSpacing;

    const heights = nodes.map((node) => compressHeight(node.totalTraffic * config.heightScale, config));
    const totalHeight = heights.reduce((sum, h) => sum + h, 0);
    const remainingSpace = config.availableHeight - totalHeight;
    const padding = nodes.length > 1 ? Math.max(0, remainingSpace / (nodes.length - 1)) : 0;

    let y = config.paddingTop;

    nodes.forEach((node, i) => {
      const height = heights[i];

      const position: NodePosition = {
        id: node.id,
        name: node.name,
        x,
        y,
        width: config.nodeWidth,
        height,
        depth: node.depth,
        totalTraffic: node.totalTraffic,
      };

      nodePositions.push(position);
      nodePositionMap.set(node.id, position);
      y += height + padding;
    });
  });

  return { nodePositions, nodePositionMap };
}

/**
 * Calculate link positions with proper stacking
 */
function calculateLinkPositions(
  graph: SankeyGraph,
  nodePositions: NodePosition[],
  nodePositionMap: Map<string, NodePosition>,
  config: LayoutConfig,
): LinkPosition[] {
  // Pre-compute available heights for links (using pre-computed totals from GraphNode)
  const availableHeights = computeAvailableHeights(graph, nodePositions);

  // Sort links to minimize crossings
  const sortedLinks = sortLinksByPosition(graph.links, nodePositionMap);

  // Initialize offsets for stacking links
  const offsets = initializeLinkOffsets(graph, nodePositions, availableHeights, config);

  // Calculate each link's position
  return sortedLinks
    .map((link) => calculateSingleLinkPosition(link, graph, nodePositionMap, availableHeights, offsets, config))
    .filter((link): link is LinkPosition => link !== null);
}

/**
 * Compute available vertical space for links at each node
 */
function computeAvailableHeights(
  graph: SankeyGraph,
  nodePositions: NodePosition[],
): { outgoing: Map<string, number>; incoming: Map<string, number> } {
  const outgoing = new Map<string, number>();
  const incoming = new Map<string, number>();

  nodePositions.forEach((pos) => {
    const node = graph.getNode(pos.id);
    if (!node) return;

    const outScale = pos.totalTraffic > 0 ? Math.min(1, node.outgoingTotal / pos.totalTraffic) : 1;
    const inScale = pos.totalTraffic > 0 ? Math.min(1, node.incomingTotal / pos.totalTraffic) : 1;

    outgoing.set(pos.id, pos.height * outScale);
    incoming.set(pos.id, pos.height * inScale);
  });

  return { outgoing, incoming };
}

/**
 * Sort links by source/target Y position to minimize crossings
 */
function sortLinksByPosition(links: GraphLink[], nodePositionMap: Map<string, NodePosition>): GraphLink[] {
  return [...links].sort((a, b) => {
    const sourceA = nodePositionMap.get(a.sourceId);
    const sourceB = nodePositionMap.get(b.sourceId);
    const targetA = nodePositionMap.get(a.targetId);
    const targetB = nodePositionMap.get(b.targetId);

    if (!sourceA || !sourceB || !targetA || !targetB) return 0;

    return sourceA.id === sourceB.id ? targetA.y - targetB.y : sourceA.y - sourceB.y;
  });
}

/**
 * Initialize link offset trackers for proper stacking
 */
function initializeLinkOffsets(
  graph: SankeyGraph,
  nodePositions: NodePosition[],
  availableHeights: { outgoing: Map<string, number>; incoming: Map<string, number> },
  config: LayoutConfig,
): { source: Map<string, number>; target: Map<string, number> } {
  const source = new Map<string, number>();
  const target = new Map<string, number>();

  nodePositions.forEach((pos) => {
    const node = graph.getNode(pos.id);
    if (!node) return;

    const outHeight = availableHeights.outgoing.get(pos.id) ?? pos.height;
    const inHeight = availableHeights.incoming.get(pos.id) ?? pos.height;

    const outPadding = (pos.height - outHeight) / 2;
    const inPadding = (pos.height - inHeight) / 2;

    source.set(pos.id, outPadding);
    target.set(pos.id, inPadding);
  });

  return { source, target };
}

/**
 * Calculate position for a single link
 */
function calculateSingleLinkPosition(
  link: GraphLink,
  graph: SankeyGraph,
  nodePositionMap: Map<string, NodePosition>,
  availableHeights: { outgoing: Map<string, number>; incoming: Map<string, number> },
  offsets: { source: Map<string, number>; target: Map<string, number> },
  config: LayoutConfig,
): LinkPosition | null {
  const sourcePos = nodePositionMap.get(link.sourceId);
  const targetPos = nodePositionMap.get(link.targetId);
  const sourceNode = graph.getNode(link.sourceId);
  const targetNode = graph.getNode(link.targetId);

  if (!sourcePos || !targetPos || !sourceNode || !targetNode) return null;

  const sourceAvailHeight = availableHeights.outgoing.get(link.sourceId) ?? sourcePos.height;
  const targetAvailHeight = availableHeights.incoming.get(link.targetId) ?? targetPos.height;

  const sourceWidth = (link.value / (sourceNode.outgoingTotal || link.value)) * sourceAvailHeight;
  const targetWidth = (link.value / (targetNode.incomingTotal || link.value)) * targetAvailHeight;
  const width = Math.min(sourceWidth, targetWidth);

  const sourceOffset = offsets.source.get(link.sourceId) || 0;
  const targetOffset = offsets.target.get(link.targetId) || 0;

  const sourceY = sourcePos.y + sourceOffset + sourceWidth / 2;
  const targetY = targetPos.y + targetOffset + targetWidth / 2;

  offsets.source.set(link.sourceId, sourceOffset + sourceWidth);
  offsets.target.set(link.targetId, targetOffset + targetWidth);

  return {
    index: link.index,
    source: sourcePos,
    target: targetPos,
    value: link.value,
    sourceY,
    targetY,
    sourceWidth,
    targetWidth,
    width,
  };
}

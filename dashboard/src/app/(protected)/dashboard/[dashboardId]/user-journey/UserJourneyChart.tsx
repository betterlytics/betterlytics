'use client';

import { useMemo, useState, useCallback } from 'react';
import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { formatString } from '@/utils/formatters';
import { useTheme } from 'next-themes';

// ============================================
// COLOR MAP - Customize colors here
// ============================================
const COLORS = {
  node: {
    fill: '#4766e5',
    stroke: '#1d4ed8',
    strokeWidth: 1,
    mutedFill: '#4766e533',
    mutedStroke: '#1d4ed833',
  },
  link: {
    stroke: '#6fa8ff88', // blue-ish
    strokeMiddle: '#6fa8ff55', // gray-blue-ish

    highlightStroke: '#3f8cff',
    highlightStrokeMiddle: '#3f8cffaa',

    mutedStroke: '#6fa8ff66',
    mutedStrokeMiddle: '#6fa8ff44',
  },
  label: {
    text: '#334155', // Slate-700
    subtext: '#64748b', // Slate-500
    mutedText: '#94a3b8', // Slate-400
    mutedSubtext: '#cbd5e1', // Slate-300
  },
};

// ============================================
// LAYOUT CONFIGURATION
// ============================================
const LAYOUT = {
  padding: { top: 20, right: 20, bottom: 24, left: 20 },
  nodeWidth: 16,
  nodeRadius: 2,
  minNodeHeight: 8,
  nodeHeightRatio: 0.5,
  linkGapRatio: 0, // Gap between links as a ratio of available space
};

// ============================================
// TYPES
// ============================================
interface NodePosition {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  totalTraffic: number;
}

interface LinkPosition {
  index: number;
  source: NodePosition;
  target: NodePosition;
  value: number;
  sourceY: number;
  targetY: number;
  sourceWidth: number;
  targetWidth: number;
  width: number;
}

interface HighlightState {
  nodeIds: Set<string>;
  linkIndices: Set<number>;
}

interface UserJourneyChartProps {
  data: SankeyData;
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function UserJourneyChart({ data }: UserJourneyChartProps) {
  const { resolvedTheme } = useTheme();
  const width = 900;
  const height = 500;

  const { nodePositions, linkPositions } = useMemo(
    () => calculateLayout(data, width, height),
    [data, width, height],
  );

  // Track hover state
  const [highlightState, setHighlightState] = useState<HighlightState | null>(null);

  // Build adjacency maps for graph traversal
  const { outgoingLinks, incomingLinks } = useMemo(() => {
    const outgoing = new Map<string, LinkPosition[]>();
    const incoming = new Map<string, LinkPosition[]>();

    linkPositions.forEach((link) => {
      const sourceId = link.source.id;
      const targetId = link.target.id;

      if (!outgoing.has(sourceId)) outgoing.set(sourceId, []);
      if (!incoming.has(targetId)) incoming.set(targetId, []);

      outgoing.get(sourceId)!.push(link);
      incoming.get(targetId)!.push(link);
    });

    return { outgoingLinks: outgoing, incomingLinks: incoming };
  }, [linkPositions]);

  // Find all connected nodes and links from a starting point
  const findConnectedElements = useCallback(
    (startNodeId: string): HighlightState => {
      const nodeIds = new Set<string>();
      const linkIndices = new Set<number>();

      // Traverse upstream (find all nodes/links that lead TO this node)
      const traverseUpstream = (nodeId: string) => {
        if (nodeIds.has(nodeId)) return;
        nodeIds.add(nodeId);

        const incoming = incomingLinks.get(nodeId) || [];
        incoming.forEach((link) => {
          linkIndices.add(link.index);
          traverseUpstream(link.source.id);
        });
      };

      // Traverse downstream (find all nodes/links that come FROM this node)
      const traverseDownstream = (nodeId: string) => {
        if (nodeIds.has(nodeId)) return;
        nodeIds.add(nodeId);

        const outgoing = outgoingLinks.get(nodeId) || [];
        outgoing.forEach((link) => {
          linkIndices.add(link.index);
          traverseDownstream(link.target.id);
        });
      };

      // Start traversal in both directions
      nodeIds.add(startNodeId);

      // Traverse upstream without adding startNodeId again
      const incoming = incomingLinks.get(startNodeId) || [];
      incoming.forEach((link) => {
        linkIndices.add(link.index);
        traverseUpstream(link.source.id);
      });

      // Traverse downstream without adding startNodeId again
      const outgoing = outgoingLinks.get(startNodeId) || [];
      outgoing.forEach((link) => {
        linkIndices.add(link.index);
        traverseDownstream(link.target.id);
      });

      return { nodeIds, linkIndices };
    },
    [outgoingLinks, incomingLinks],
  );

  // Handle node hover
  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      if (nodeId === null) {
        setHighlightState(null);
      } else {
        setHighlightState(findConnectedElements(nodeId));
      }
    },
    [findConnectedElements],
  );

  // Handle link hover
  const handleLinkHover = useCallback(
    (link: LinkPosition | null) => {
      if (link === null) {
        setHighlightState(null);
      } else {
        // For a link, we need to find all upstream from source and downstream from target
        const nodeIds = new Set<string>();
        const linkIndices = new Set<number>();

        // Add the hovered link itself
        linkIndices.add(link.index);
        nodeIds.add(link.source.id);
        nodeIds.add(link.target.id);

        // Traverse upstream from source
        const traverseUpstream = (nodeId: string) => {
          const incoming = incomingLinks.get(nodeId) || [];
          incoming.forEach((inLink) => {
            if (!linkIndices.has(inLink.index)) {
              linkIndices.add(inLink.index);
              nodeIds.add(inLink.source.id);
              traverseUpstream(inLink.source.id);
            }
          });
        };

        // Traverse downstream from target
        const traverseDownstream = (nodeId: string) => {
          const outgoing = outgoingLinks.get(nodeId) || [];
          outgoing.forEach((outLink) => {
            if (!linkIndices.has(outLink.index)) {
              linkIndices.add(outLink.index);
              nodeIds.add(outLink.target.id);
              traverseDownstream(outLink.target.id);
            }
          });
        };

        traverseUpstream(link.source.id);
        traverseDownstream(link.target.id);

        setHighlightState({ nodeIds, linkIndices });
      }
    },
    [outgoingLinks, incomingLinks],
  );

  if (!data.nodes.length) {
    return (
      <div className='text-muted-foreground flex h-[500px] w-full items-center justify-center'>
        No journey data available
      </div>
    );
  }

  const isHighlighting = highlightState !== null;

  return (
    <div className='w-full overflow-x-auto'>
      <svg
        viewBox={`0 0 ${width} ${2 * height}`}
        className='min-w-[700px]'
        onMouseLeave={() => setHighlightState(null)}
      >
        {/* Definitions for filters */}
        <defs>
          <filter id='textShadowLight' x='-50%' y='-50%' width='200%' height='200%'>
            <feDropShadow dx='0' dy='0' stdDeviation='1.4' floodColor='#0f172a' floodOpacity='0.2' />
          </filter>
          <filter id='textShadowDark' x='-50%' y='-50%' width='200%' height='200%'>
            <feDropShadow dx='0' dy='0' stdDeviation='1.2' floodColor='#ffffff' floodOpacity='0.32' />
          </filter>
        </defs>

        {/* Links layer (rendered behind nodes) */}
        <g className='links'>
          {linkPositions.map((link) => (
            <SankeyLink
              key={`link-${link.index}`}
              link={link}
              isHighlighted={isHighlighting && highlightState.linkIndices.has(link.index)}
              isMuted={isHighlighting && !highlightState.linkIndices.has(link.index)}
              onHover={handleLinkHover}
            />
          ))}
        </g>

        {/* Nodes layer */}
        <g className='nodes'>
          {nodePositions.map((node) => (
            <SankeyNode
              key={node.id}
              node={node}
              isHighlighted={isHighlighting && highlightState.nodeIds.has(node.id)}
              isMuted={isHighlighting && !highlightState.nodeIds.has(node.id)}
              onHover={handleNodeHover}
              theme={resolvedTheme as 'light' | 'dark' | undefined}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

// ============================================
// LAYOUT CALCULATION
// ============================================
function calculateLayout(
  data: SankeyData,
  width: number,
  height: number,
): { nodePositions: NodePosition[]; linkPositions: LinkPosition[] } {
  const { nodes, links } = data;
  const { padding, nodeWidth, minNodeHeight, linkGapRatio, nodeHeightRatio } = LAYOUT;
  const labelMargin = 110; // reserve space on the right for inline labels

  if (nodes.length === 0) {
    return { nodePositions: [], linkPositions: [] };
  }

  // Build connection maps first (before positioning)
  const outgoingLinks = new Map<string, Array<{ targetId: string; value: number }>>();
  const incomingLinks = new Map<string, Array<{ sourceId: string; value: number }>>();
  const nodeById = new Map<string, (typeof nodes)[0]>();

  nodes.forEach((node) => {
    nodeById.set(node.id, node);
    outgoingLinks.set(node.id, []);
    incomingLinks.set(node.id, []);
  });

  links.forEach((link) => {
    const sourceNode = nodes[link.source];
    const targetNode = nodes[link.target];
    if (sourceNode && targetNode) {
      outgoingLinks.get(sourceNode.id)!.push({ targetId: targetNode.id, value: link.value });
      incomingLinks.get(targetNode.id)!.push({ sourceId: sourceNode.id, value: link.value });
    }
  });

  // Group nodes by depth
  const depthGroups = new Map<number, typeof nodes>();
  let maxDepth = 0;

  nodes.forEach((node) => {
    if (!depthGroups.has(node.depth)) {
      depthGroups.set(node.depth, []);
    }
    depthGroups.get(node.depth)!.push(node);
    maxDepth = Math.max(maxDepth, node.depth);
  });

  // Calculate available space
  const availableWidth = Math.max(0, width - padding.left - padding.right - nodeWidth - labelMargin);
  const availableHeight = height - padding.top - padding.bottom;
  const depthSpacing = maxDepth > 0 ? availableWidth / maxDepth : 0;

  // Find the maximum total traffic in any single column for scaling node heights
  let maxColumnTraffic = 0;
  depthGroups.forEach((depthNodes) => {
    const columnTotal = depthNodes.reduce((sum, n) => sum + n.totalTraffic, 0);
    maxColumnTraffic = Math.max(maxColumnTraffic, columnTotal);
  });

  // Calculate height scale factor based on max column
  const maxNodeCount = Math.max(...Array.from(depthGroups.values()).map((g) => g.length));
  const minTotalPadding = (maxNodeCount - 1) * 8;
  const heightScale = ((availableHeight - minTotalPadding) / maxColumnTraffic) * nodeHeightRatio;

  // Calculate initial Y positions for barycenter calculation
  // (temporary positions based on order in data)
  const nodeYCenter = new Map<string, number>();

  const positionColumn = (depthNodes: typeof nodes) => {
    const columnTraffic = depthNodes.reduce((sum, n) => sum + n.totalTraffic, 0);
    const totalNodeHeight = columnTraffic * heightScale;
    const remainingSpace = availableHeight - totalNodeHeight;
    const dynamicPadding = depthNodes.length > 1 ? remainingSpace / (depthNodes.length - 1) : 0;

    let currentY = padding.top;
    depthNodes.forEach((node) => {
      const nodeHeight = Math.max(node.totalTraffic * heightScale, minNodeHeight);
      nodeYCenter.set(node.id, currentY + nodeHeight / 2);
      currentY += nodeHeight + dynamicPadding;
    });
  };

  // Initial positioning
  for (let depth = 0; depth <= maxDepth; depth++) {
    const depthNodes = depthGroups.get(depth) || [];
    positionColumn(depthNodes);
  }

  // Barycenter method: iteratively reorder nodes to minimize crossings
  const ITERATIONS = 4;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Forward pass: order by incoming connections
    for (let depth = 1; depth <= maxDepth; depth++) {
      const depthNodes = depthGroups.get(depth) || [];

      // Calculate barycenter for each node based on incoming connections
      const barycenters = depthNodes.map((node) => {
        const incoming = incomingLinks.get(node.id) || [];
        if (incoming.length === 0) {
          return { node, barycenter: nodeYCenter.get(node.id) || 0 };
        }

        let weightedSum = 0;
        let totalWeight = 0;
        incoming.forEach(({ sourceId, value }) => {
          const sourceY = nodeYCenter.get(sourceId) || 0;
          weightedSum += sourceY * value;
          totalWeight += value;
        });

        return {
          node,
          barycenter: totalWeight > 0 ? weightedSum / totalWeight : nodeYCenter.get(node.id) || 0,
        };
      });

      // Sort by barycenter
      barycenters.sort((a, b) => a.barycenter - b.barycenter);
      depthGroups.set(
        depth,
        barycenters.map((b) => b.node),
      );

      // Recalculate positions
      positionColumn(depthGroups.get(depth)!);
    }

    // Backward pass: order by outgoing connections
    for (let depth = maxDepth - 1; depth >= 0; depth--) {
      const depthNodes = depthGroups.get(depth) || [];

      const barycenters = depthNodes.map((node) => {
        const outgoing = outgoingLinks.get(node.id) || [];
        if (outgoing.length === 0) {
          return { node, barycenter: nodeYCenter.get(node.id) || 0 };
        }

        let weightedSum = 0;
        let totalWeight = 0;
        outgoing.forEach(({ targetId, value }) => {
          const targetY = nodeYCenter.get(targetId) || 0;
          weightedSum += targetY * value;
          totalWeight += value;
        });

        return {
          node,
          barycenter: totalWeight > 0 ? weightedSum / totalWeight : nodeYCenter.get(node.id) || 0,
        };
      });

      barycenters.sort((a, b) => a.barycenter - b.barycenter);
      depthGroups.set(
        depth,
        barycenters.map((b) => b.node),
      );

      positionColumn(depthGroups.get(depth)!);
    }
  }

  // Final node positioning
  const nodePositions: NodePosition[] = [];
  const nodeMap = new Map<number, NodePosition>();

  depthGroups.forEach((depthNodes, depth) => {
    const x = padding.left + depth * depthSpacing;
    const columnTraffic = depthNodes.reduce((sum, n) => sum + n.totalTraffic, 0);
    const totalNodeHeight = columnTraffic * heightScale * nodeHeightRatio;
    const remainingSpace = availableHeight - totalNodeHeight;
    const dynamicPadding = depthNodes.length > 1 ? remainingSpace / (depthNodes.length - 1) : 0;

    let currentY = padding.top;

    depthNodes.forEach((node) => {
      const nodeHeight = Math.max(node.totalTraffic * heightScale, minNodeHeight);
      const originalIndex = nodes.findIndex((n) => n.id === node.id);

      const pos: NodePosition = {
        id: node.id,
        name: node.name,
        x,
        y: currentY,
        width: nodeWidth,
        height: nodeHeight,
        depth: node.depth,
        totalTraffic: node.totalTraffic,
      };

      nodePositions.push(pos);
      nodeMap.set(originalIndex, pos);

      currentY += nodeHeight + dynamicPadding;
    });
  });

  // Pre-calculate total outgoing/incoming link values per node
  const outgoingTotals = new Map<string, number>();
  const incomingTotals = new Map<string, number>();
  const outgoingCounts = new Map<string, number>();
  const incomingCounts = new Map<string, number>();

  links.forEach((link) => {
    const sourceNode = nodeMap.get(link.source);
    const targetNode = nodeMap.get(link.target);
    if (sourceNode && targetNode) {
      outgoingTotals.set(sourceNode.id, (outgoingTotals.get(sourceNode.id) || 0) + link.value);
      incomingTotals.set(targetNode.id, (incomingTotals.get(targetNode.id) || 0) + link.value);
      outgoingCounts.set(sourceNode.id, (outgoingCounts.get(sourceNode.id) || 0) + 1);
      incomingCounts.set(targetNode.id, (incomingCounts.get(targetNode.id) || 0) + 1);
    }
  });

  // Sort links at each node by target/source Y position to minimize local crossings
  const sortedLinks = [...links].sort((a, b) => {
    const sourceA = nodeMap.get(a.source);
    const sourceB = nodeMap.get(b.source);
    const targetA = nodeMap.get(a.target);
    const targetB = nodeMap.get(b.target);

    if (!sourceA || !sourceB || !targetA || !targetB) return 0;

    // First sort by source node Y, then by target node Y
    if (sourceA.id === sourceB.id) {
      return targetA.y - targetB.y;
    }
    return sourceA.y - sourceB.y;
  });

  // Calculate link positions with proper spacing
  const sourceOffsets = new Map<string, number>();
  const targetOffsets = new Map<string, number>();

  // Initialize offsets with gap accounting
  nodePositions.forEach((node) => {
    const outCount = outgoingCounts.get(node.id) || 0;
    const inCount = incomingCounts.get(node.id) || 0;

    const outGapTotal = outCount > 1 ? node.height * linkGapRatio : 0;
    const inGapTotal = inCount > 1 ? node.height * linkGapRatio : 0;

    sourceOffsets.set(node.id, outCount > 1 ? outGapTotal / (outCount + 1) : 0);
    targetOffsets.set(node.id, inCount > 1 ? inGapTotal / (inCount + 1) : 0);
  });

  // Create a map to track original indices
  const originalIndices = new Map<(typeof links)[0], number>();
  links.forEach((link, idx) => originalIndices.set(link, idx));

  const linkPositions: LinkPosition[] = sortedLinks
    .map((link) => {
      const sourceNode = nodeMap.get(link.source);
      const targetNode = nodeMap.get(link.target);
      const originalIndex = originalIndices.get(link) ?? 0;

      if (!sourceNode || !targetNode) {
        return null;
      }

      const outCount = outgoingCounts.get(sourceNode.id) || 1;
      const inCount = incomingCounts.get(targetNode.id) || 1;

      const sourceAvailableHeight = sourceNode.height;
      const targetAvailableHeight = targetNode.height;

      const outTotal = outgoingTotals.get(sourceNode.id) || link.value;
      const inTotal = incomingTotals.get(targetNode.id) || link.value;

      const sourceWidth = (link.value / outTotal) * sourceAvailableHeight;
      const targetWidth = (link.value / inTotal) * targetAvailableHeight;
      const linkWidth = Math.min(sourceWidth, targetWidth);

      const sourceOffset = sourceOffsets.get(sourceNode.id) || 0;
      const targetOffset = targetOffsets.get(targetNode.id) || 0;

      const sourceY = sourceNode.y + sourceOffset + sourceWidth / 2;
      const targetY = targetNode.y + targetOffset + targetWidth / 2;

      const sourceGap = (sourceNode.height * linkGapRatio) / (outCount || 1);
      const targetGap = (targetNode.height * linkGapRatio) / (inCount || 1);

      sourceOffsets.set(sourceNode.id, sourceOffset + sourceWidth + sourceGap);
      targetOffsets.set(targetNode.id, targetOffset + targetWidth + targetGap);

      return {
        index: originalIndex,
        source: sourceNode,
        target: targetNode,
        value: link.value,
        sourceY,
        targetY,
        sourceWidth,
        targetWidth,
        width: linkWidth,
      };
    })
    .filter((link): link is LinkPosition => link !== null);

  return { nodePositions, linkPositions };
}

// ============================================
// NODE COMPONENT
// ============================================
interface SankeyNodeProps {
  node: NodePosition;
  isHighlighted: boolean;
  isMuted: boolean;
  onHover: (nodeId: string | null) => void;
  theme: 'light' | 'dark' | undefined;
}

function SankeyNode({ node, isHighlighted, isMuted, onHover, theme }: SankeyNodeProps) {
  // Inline label positioning - text directly to the right of the node
  const labelX = node.x + node.width + 6;
  const labelCenterY = node.y + node.height / 2;
  const textShadowId = theme === 'dark' ? 'textShadowDark' : 'textShadowLight';

  const isDark = theme === 'dark';
  const nodeFill = isMuted ? COLORS.node.mutedFill : COLORS.node.fill;
  const nodeStroke = isMuted ? COLORS.node.mutedStroke : COLORS.node.stroke;
  const textFill = isMuted ? COLORS.label.mutedText : isDark ? '#f8fafc' : '#0f172a';
  const subtextFill = isMuted ? COLORS.label.mutedSubtext : isDark ? '#e2e8f0' : '#475569';
  const labelOpacity = isMuted ? 0.4 : 1;

  return (
    <g onMouseEnter={() => onHover(node.id)} onMouseLeave={() => onHover(null)} className='cursor-pointer'>
      {/* Node rectangle */}
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx={LAYOUT.nodeRadius}
        ry={LAYOUT.nodeRadius}
        fill={nodeFill}
        stroke={nodeStroke}
        strokeWidth={COLORS.node.strokeWidth}
        className='transition-colors duration-150'
      />

      {/* Inline label - node name */}
      <text
        x={labelX}
        y={labelCenterY - 5}
        textAnchor='start'
        dominantBaseline='middle'
        fontSize={10}
        fontWeight={500}
        fill={textFill}
        filter={`url(#${textShadowId})`}
        className='pointer-events-none transition-colors duration-150 select-none'
        opacity={labelOpacity}
      >
        {formatString(node.name, 18)}
      </text>

      {/* Inline label - traffic count */}
      <text
        x={labelX}
        y={labelCenterY + 7}
        textAnchor='start'
        dominantBaseline='middle'
        fontSize={10.5}
        fontWeight={600}
        fill={subtextFill}
        filter={`url(#${textShadowId})`}
        className='pointer-events-none transition-colors duration-150 select-none'
        opacity={labelOpacity}
      >
        {formatNumber(node.totalTraffic)}
      </text>
    </g>
  );
}

// Format large numbers with K/M suffix
function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// ============================================
// LINK COMPONENT
// ============================================
interface SankeyLinkProps {
  link: LinkPosition;
  isHighlighted: boolean;
  isMuted: boolean;
  onHover: (link: LinkPosition | null) => void;
}

function SankeyLink({ link, isHighlighted, isMuted, onHover }: SankeyLinkProps) {
  // Start and end points
  const x0 = link.source.x + link.source.width;
  const y0 = link.sourceY;
  const x1 = link.target.x;
  const y1 = link.targetY;

  // Curvature
  const curvature = 0.5;
  const cx0 = x0 + (x1 - x0) * curvature;
  const cx1 = x1 - (x1 - x0) * curvature;

  const path = `M ${x0},${y0} C ${cx0},${y0} ${cx1},${y1} ${x1},${y1}`;

  // Build a unique gradient ID per link
  const gradientId = `gradient-${link.source.id}-${link.target.id}`.replace(/\s+/g, '-');

  // Base colors — you can tune these or derive from highlight/muted state
  const start = isMuted
    ? COLORS.link.mutedStroke
    : isHighlighted
      ? COLORS.link.highlightStroke
      : COLORS.link.stroke;
  const mid = isMuted
    ? COLORS.link.mutedStrokeMiddle
    : isHighlighted
      ? COLORS.link.highlightStrokeMiddle
      : COLORS.link.strokeMiddle;
  const end = start; // symmetric

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits='userSpaceOnUse' x1={x0} y1={y0} x2={x1} y2={y1}>
          <stop offset='0%' stopColor={start} />
          <stop offset='30%' stopColor={mid} />
          <stop offset='70%' stopColor={mid} />
          <stop offset='100%' stopColor={end} />
        </linearGradient>
      </defs>

      <path
        d={path}
        fill='none'
        stroke={`url(#${gradientId})`}
        strokeWidth={link.width}
        strokeLinecap='butt'
        className='cursor-pointer transition-[stroke-opacity] duration-150'
        onMouseEnter={() => onHover(link)}
        onMouseLeave={() => onHover(null)}
      >
        <title>{`${link.source.name} → ${link.target.name}: ${formatNumber(link.value)} users`}</title>
      </path>
    </>
  );
}

'use client';

import { useMemo, useState, useCallback } from 'react';
import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { HighlightState } from './types';
import { createSankeyGraph } from './SankeyGraph';
import { calculateLayout } from './layoutCalculation';
import { SankeyNode, SankeyLink } from './components';
import { useTranslations } from 'next-intl';

interface UserJourneyChartProps {
  data: SankeyData;
}

export default function UserJourneyChart({ data }: UserJourneyChartProps) {
  const t = useTranslations('dashboard.emptyStates');

  // Build the graph structure once - this contains all nodes, links, and adjacency info
  const graph = useMemo(() => createSankeyGraph(data), [data]);

  // Calculate SVG dimensions based on graph structure
  const { width, height } = useMemo(() => {
    return {
      width: 900,
      height: graph.maxColumnCount * 100,
    };
  }, [graph]);

  // Calculate visual layout positions
  const { nodePositions, linkPositions } = useMemo(
    () => calculateLayout(graph, width, height),
    [graph, width, height],
  );

  // Track hover/highlight state
  const [highlightState, setHighlightState] = useState<HighlightState | null>(null);

  // Handle node hover - use graph's traversal method
  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      if (nodeId === null) {
        setHighlightState(null);
      } else {
        setHighlightState(graph.findConnectedFromNode(nodeId));
      }
    },
    [graph],
  );

  // Handle link hover - use graph's traversal method
  const handleLinkHover = useCallback(
    (linkIndex: number | null) => {
      if (linkIndex === null) {
        setHighlightState(null);
      } else {
        setHighlightState(graph.findConnectedFromLink(linkIndex));
      }
    },
    [graph],
  );

  const isHighlighting = highlightState !== null;

  if (graph.isEmpty) {
    return (
      <div className='text-muted-foreground flex h-[500px] w-full items-center justify-center'>
        {t('noUserJourneyData')}
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${1.25 * height}`} onMouseLeave={() => setHighlightState(null)}>
      {/* Definitions for filters */}
      <defs>
        <filter id='textShadowLight' x='-50%' y='-50%' width='200%' height='200%'>
          <feDropShadow dx='0' dy='0' stdDeviation='1.4' floodColor='#0f172a' floodOpacity='0.2' />
        </filter>
        <filter id='textShadowDark' x='-50%' y='-50%' width='200%' height='200%'>
          <feDropShadow dx='0' dy='0' stdDeviation='1.2' floodColor='#ffffff' floodOpacity='0.32' />
        </filter>
        <filter id='cardGlow' x='-20%' y='-20%' width='140%' height='140%'>
          <feDropShadow dx='0' dy='1' stdDeviation='3' floodColor='#6366f1' floodOpacity='0.15' />
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
            onHover={(hoveredLink) => handleLinkHover(hoveredLink?.index ?? null)}
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
            maxTraffic={graph.maxTraffic}
          />
        ))}
      </g>
    </svg>
  );
}

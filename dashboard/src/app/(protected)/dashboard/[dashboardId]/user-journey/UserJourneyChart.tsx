'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { SankeyData } from '@/entities/analytics/userJourney.entities';
import { HighlightState, TooltipState } from './types';
import { createSankeyGraph } from './SankeyGraph';
import { calculateLayout } from './layoutCalculation';
import { SankeyNode, SankeyLink } from './components';
import { TooltipComponent } from './components/SankeyTooltip';

interface UserJourneyChartProps {
  data: SankeyData;
}

export default function UserJourneyChart({ data }: UserJourneyChartProps) {
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

  const [lockedState, setLockedState] = useState<HighlightState | null>(null);
  const [hoverState, setHoverState] = useState<HighlightState | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  const containerRef = useRef<SVGSVGElement>(null);

  const updateTooltip = useCallback((newTooltip: Partial<TooltipState>) => {
    setTooltip((prev) => ({ ...prev, ...newTooltip }));
  }, []);

  useEffect(() => {
    if (hoverState === null) {
      updateTooltip({ visible: false });
    }
  }, [hoverState, updateTooltip]);

  // Global mouse move handler to ensure tooltip disappears.
  // This is to ensure the tooltip disappears when the mouse leaves the container
  // as it sometimes doesn't trigger the onMouseLeave event for some reason
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!tooltip.visible) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        setHoverState(null);
      }
    };

    if (tooltip.visible) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [tooltip.visible]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left || 0) + 10;
      const y = e.clientY - (rect?.top || 0) - 40;

      updateTooltip({ x, y });
    },
    [updateTooltip],
  );

  const handleNodeHover = useCallback(
    (nodeId: string | null) => {
      if (nodeId === null) {
        setHoverState(null);
      } else {
        updateTooltip({ visible: false });
        setHoverState(graph.findConnectedFromNode(nodeId));
      }
    },
    [graph, updateTooltip],
  );

  const handleLinkHover = useCallback(
    (linkIndex: number | null) => {
      if (linkIndex === null) {
        setHoverState(null);
      } else {
        setHoverState(graph.findConnectedFromLink(linkIndex));

        const link = graph.links[linkIndex];
        const sourceNode = graph.getNode(link.sourceId);
        const targetNode = graph.getNode(link.targetId);
        updateTooltip({
          visible: true,
          content: { source: sourceNode?.name || '', target: targetNode?.name || '', value: link.value },
        });
      }
    },
    [graph, updateTooltip],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (lockedState?.nodeIds.has(nodeId)) {
        setLockedState(null);
      } else {
        setLockedState(graph.findConnectedFromNode(nodeId));
      }
    },
    [graph, lockedState],
  );

  const handleLinkClick = useCallback(
    (linkIndex: number) => {
      if (lockedState?.linkIndices.has(linkIndex)) {
        setLockedState(null);
      } else {
        setLockedState(graph.findConnectedFromLink(linkIndex));
      }
    },
    [graph, lockedState],
  );

  const handleBackgroundClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) {
      setLockedState(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverState(null);
  }, []);

  const isLocked = lockedState !== null;
  const isHovering = hoverState !== null;
  const isHighlighting = isLocked || isHovering;

  return (
    <div className='relative z-10'>
      <svg
        ref={containerRef}
        className='relative z-10'
        viewBox={`0 0 ${width} ${1.25 * height}`}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleBackgroundClick}
      >
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
          {linkPositions.map((link) => {
            const isLinkLocked = isLocked && lockedState.linkIndices.has(link.index);
            const isLinkHovered = isHovering && hoverState.linkIndices.has(link.index);
            const isLinkHighlighted = isLinkLocked || isLinkHovered;
            const isLinkMuted = isHighlighting && !isLinkLocked && !isLinkHovered;
            return (
              <SankeyLink
                key={`link-${link.index}`}
                link={link}
                isHighlighted={isLinkHighlighted}
                isMuted={isLinkMuted}
                isLocked={isLinkLocked}
                onHover={(hoveredLink) => handleLinkHover(hoveredLink?.index ?? null)}
                onClick={(clickedLink) => handleLinkClick(clickedLink.index)}
              />
            );
          })}
        </g>

        {/* Nodes layer */}
        <g className='nodes'>
          {nodePositions.map((node) => {
            const isNodeLocked = isLocked && lockedState.nodeIds.has(node.id);
            const isNodeHovered = isHovering && hoverState.nodeIds.has(node.id);
            const isNodeHighlighted = isNodeLocked || isNodeHovered;
            const isNodeMuted = isHighlighting && !isNodeLocked && !isNodeHovered;
            return (
              <SankeyNode
                key={node.id}
                node={node}
                isHighlighted={isNodeHighlighted}
                isMuted={isNodeMuted}
                onHover={handleNodeHover}
                onClick={handleNodeClick}
                totalEntrySessions={graph.totalEntrySessions}
              />
            );
          })}
        </g>
      </svg>
      <TooltipComponent tooltip={tooltip} />
    </div>
  );
}

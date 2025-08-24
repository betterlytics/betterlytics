'use client';

import { SankeyData } from '@/entities/userJourney';
import { useTranslations } from 'next-intl';
import { Sankey, Rectangle, ResponsiveContainer, Layer, Text } from 'recharts';
import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';

const Colors = {
  primary: '#0ea5e9', // Blue - Color of root nodes
  secondary: '#64748b', // Gray - Color of other nodes
  labelBg: '#f8fafc', // Light Gray - Background color of label box
  labelBorder: '#cbd5e1', // Gray - Border color of label box
  labelText: '#334155', // Dark Gray - Text color of label text
  labelTextDark: '#475569', // Gray - Text color of label count
} as const;

interface UserJourneyChartProps {
  data: SankeyData;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: {
    source: string;
    target: string;
    value: number;
  } | null;
}

interface NodeLabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
  count: number;
}

// Accurately measure text width using Canvas https://www.w3schools.com/tags/canvas_measuretext.asp
const measureTextWidth = (() => {
  // Create a canvas once to avoid recreating it for each measurement
  let canvas: HTMLCanvasElement | null = null;

  return (text: string, fontSize: number, fontFamily: string = 'Arial'): number => {
    if (!canvas && typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
    }

    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.font = `${fontSize}px ${fontFamily}`;
        const metrics = context.measureText(text);
        return metrics.width + 10; // Add 10px padding for better fit
      }
    }

    // Fallback to approximation if canvas is not available
    const avgCharWidth = fontSize * 0.55;
    return Math.max(text.length * avgCharWidth, 30);
  };
})();

const NodeLabel = memo(({ x, y, width, height, url, count }: NodeLabelProps) => {
  // Calculate dimensions for the label box
  const urlWidth = measureTextWidth(url, 12);
  const countWidth = measureTextWidth(count.toString(), 14);
  const contentWidth = Math.max(urlWidth, countWidth);

  const paddingX = 8;
  const boxWidth = contentWidth + paddingX * 2;
  const boxHeight = 55;
  const boxX = x + width + 5;
  const boxY = y + (height - boxHeight) / 2;

  const textPadding = paddingX;

  return (
    <Layer>
      {/* Background box */}
      <Rectangle
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        fill={Colors.labelBg}
        fillOpacity={0.6}
        stroke={Colors.labelBorder}
        strokeWidth={1}
        rx={4}
        ry={4}
      />

      {/* URL text */}
      <Text
        x={boxX + textPadding}
        y={boxY + 18}
        textAnchor='start'
        verticalAnchor='middle'
        fontSize={12}
        fill={Colors.labelText}
      >
        {url}
      </Text>

      {/* Count text */}
      <Text
        x={boxX + textPadding}
        y={boxY + 38}
        textAnchor='start'
        verticalAnchor='middle'
        fontSize={14}
        fontWeight='bold'
        fill={Colors.labelTextDark}
      >
        {count}
      </Text>
    </Layer>
  );
});

NodeLabel.displayName = 'NodeLabel';

export default function UserJourneyChart({ data }: UserJourneyChartProps) {
  const t = useTranslations('components.userJourney');
  const [activeLink, setActiveLink] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateTooltip = useCallback((newTooltip: Partial<TooltipState>) => {
    setTooltip((prev) => ({ ...prev, ...newTooltip }));
  }, []);

  // Calculate dynamic height based on number of nodes
  const chartHeight = useMemo(() => {
    if (!data?.nodes?.length) return 500;

    // Count max nodes at any depth level
    const nodesByDepth: Record<number, number> = {};
    data.nodes.forEach((node) => {
      const depth = node.depth || 0;
      nodesByDepth[depth] = (nodesByDepth[depth] || 0) + 1;
    });

    const maxNodesInOneColumn = Math.max(...Object.values(nodesByDepth));

    // Each node needs about 70px of height minimum to ensure they don't overlap with their labels
    const baseHeight = maxNodesInOneColumn * 70;
    return Math.max(500, baseHeight);
  }, [data]);

  useEffect(() => {
    if (activeLink === null) {
      updateTooltip({ visible: false });
    }
  }, [activeLink, updateTooltip]);

  // Global mouse move handler to ensure tooltip disappears.
  // This is to ensure the tooltip disappears when the mouse leaves the container as it sometimes doesn't trigger the onMouseLeave event for some reason
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!tooltip.visible) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Check if mouse is outside the container
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        setActiveLink(null);
      }
    };

    const currentTimeoutRef = tooltipTimeoutRef.current;

    if (tooltip.visible) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
    };
  }, [tooltip.visible, updateTooltip]);

  const CustomNode = useMemo(() => {
    const Component = (props: {
      x: number;
      y: number;
      width: number;
      height: number;
      payload: { depth: number; name: string; totalTraffic: number };
    }) => {
      const { x, y, width, height, payload } = props;
      const isFirstColumn = payload.depth === 0;

      return (
        <>
          <Rectangle
            x={x}
            y={y}
            width={width}
            height={height}
            fill={isFirstColumn ? Colors.primary : Colors.secondary}
            fillOpacity={0.9}
          />
          <NodeLabel x={x} y={y} width={width} height={height} url={payload.name} count={payload.totalTraffic} />
        </>
      );
    };
    Component.displayName = 'CustomNode';
    return Component;
  }, []);

  const CustomLink = useMemo(() => {
    const Component = (props: {
      sourceX: number;
      sourceY: number;
      sourceControlX: number;
      targetX: number;
      targetY: number;
      targetControlX: number;
      linkWidth: number;
      index: number;
      payload: { source?: { name: string }; target?: { name: string }; value: number };
    }) => {
      const { sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, index, payload } =
        props;

      const handleMouseEnter = (e: React.MouseEvent) => {
        setActiveLink(index);

        try {
          const source = payload?.source?.name || 'Unknown';
          const target = payload?.target?.name || 'Unknown';

          const rect = containerRef.current?.getBoundingClientRect();
          const x = e.clientX - (rect?.left || 0) + 10;
          const y = e.clientY - (rect?.top || 0) - 40;

          updateTooltip({
            visible: true,
            x,
            y,
            content: {
              source: source,
              target: target,
              value: payload.value || 0,
            },
          });
        } catch (error) {
          console.error('Error showing tooltip:', error);
        }
      };

      const handleMouseMove = (e: React.MouseEvent) => {
        if (activeLink === index) {
          const rect = containerRef.current?.getBoundingClientRect();
          const x = e.clientX - (rect?.left || 0) + 10;
          const y = e.clientY - (rect?.top || 0) - 40;

          updateTooltip({ x, y });
        }
      };

      return (
        <path
          d={`
            M${sourceX},${sourceY}
            C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
          `}
          fill='none'
          stroke={activeLink === index ? Colors.primary : '#aaa'}
          strokeWidth={linkWidth}
          strokeOpacity={activeLink !== null && activeLink !== index ? 0.3 : 0.7}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActiveLink(null)}
        />
      );
    };
    Component.displayName = 'CustomLink';
    return Component;
  }, [activeLink, updateTooltip]);

  const TooltipComponent = useMemo(() => {
    if (!tooltip.visible || !tooltip.content) return null;

    return (
      <div
        className='absolute z-10 rounded border bg-white p-2 shadow-md'
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          pointerEvents: 'none',
        }}
      >
        <p className='font-medium text-gray-800'>
          {tooltip.content.source} → {tooltip.content.target}
        </p>
        <p className='text-sm text-gray-600'>
          {t('sessions')}: {tooltip.content.value}
        </p>
      </div>
    );
  }, [tooltip.visible, tooltip.content, tooltip.x, tooltip.y]);

  return (
    <div className='w-full'>
      <div
        className='relative w-full'
        style={{ height: `${chartHeight}px`, minHeight: '500px' }}
        ref={containerRef}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <Sankey
            data={data}
            node={CustomNode}
            link={CustomLink}
            margin={{ top: 20, right: 240, bottom: 30, left: 20 }}
            nodePadding={50}
            nodeWidth={10}
            iterations={64}
            linkCurvature={0.5}
          />
        </ResponsiveContainer>

        {TooltipComponent}
      </div>
    </div>
  );
}

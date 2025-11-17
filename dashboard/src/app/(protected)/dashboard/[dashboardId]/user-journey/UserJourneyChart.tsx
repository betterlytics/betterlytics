'use client';

import { SankeyData } from '@/entities/userJourney';
import { useTranslations } from 'next-intl';
import { Sankey, Rectangle, ResponsiveContainer, Layer, Text } from 'recharts';
import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { formatNumber } from '@/utils/formatters';

function useThemeVars(varNames: string[]) {
  const [vars, setVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const resolved: Record<string, string> = {};

    for (const name of varNames) {
      const raw = cs.getPropertyValue(`--${name}`).trim();
      if (!raw) continue;
      if (/^\d/.test(raw)) {
        resolved[name] = `hsl(${raw})`;
      } else {
        resolved[name] = raw;
      }
    }

    setVars(resolved);
  }, [varNames.join('|')]);

  return vars;
}

const FALLBACK_COLORS = {
  primary: '#0ea5e9',
  secondary: '#64748b',
  border: '#e2e8f0',
  card: '#0b1220',
  labelBg: '#0b1220',
  labelBorder: '#1f2a37',
  labelText: '#e5e7eb',
  labelTextMuted: '#cbd5e1',
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
        fill='var(--chart-node-label-bg, rgba(0,0,0,0.5))'
        fillOpacity={0.55}
        stroke='var(--chart-node-label-border, rgba(255,255,255,0.08))'
        strokeWidth={1}
        radius={8}
      />

      {/* URL text */}
      <Text
        x={boxX + textPadding}
        y={boxY + 18}
        textAnchor='start'
        verticalAnchor='middle'
        fontSize={12}
        fill='var(--chart-node-label-fg, #e5e7eb)'
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
        fill='var(--chart-node-label-fg-muted, #cbd5e1)'
      >
        {count}
      </Text>
    </Layer>
  );
});

NodeLabel.displayName = 'NodeLabel';

export default function UserJourneyChart({ data }: UserJourneyChartProps) {
  const t = useTranslations('components.userJourney');

  // Resolve theme tokens once (client-only)
  const themeVars = useThemeVars([
    'primary',
    'secondary',
    'muted-foreground',
    'border',
    'card',
    'popover-foreground',
  ]);

  const primaryColor = themeVars['primary'] || FALLBACK_COLORS.primary;
  const secondaryColor = themeVars['muted-foreground'] || FALLBACK_COLORS.secondary;
  const borderColor = themeVars['border'] || FALLBACK_COLORS.border;
  const cardBg = themeVars['card'] || FALLBACK_COLORS.card;
  const labelFg = themeVars['popover-foreground'] || FALLBACK_COLORS.labelText;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--chart-node-label-bg', cardBg);
    root.style.setProperty('--chart-node-label-border', borderColor);
    root.style.setProperty('--chart-node-label-fg', labelFg);
    root.style.setProperty('--chart-node-label-fg-muted', FALLBACK_COLORS.labelTextMuted);
  }, [cardBg, borderColor, labelFg]);

  const primaryFill = useMemo(() => {
    return `color-mix(in oklab, ${primaryColor} 88%, white)`;
  }, [primaryColor]);

  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const update = () => setIsDarkMode(root.classList.contains('dark'));
    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [activeLink, setActiveLink] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(0);

  const updateTooltip = useCallback((newTooltip: Partial<TooltipState>) => {
    setTooltip((prev) => ({ ...prev, ...newTooltip }));
  }, []);

  const maxNodesInOneColumn = useMemo(() => {
    if (!data?.nodes?.length) return 1;
    const nodesByDepth: Record<number, number> = {};
    for (const node of data.nodes) {
      const depth = node.depth || 0;
      nodesByDepth[depth] = (nodesByDepth[depth] || 0) + 1;
    }
    return Math.max(...Object.values(nodesByDepth));
  }, [data]);

  const chartHeight = useMemo(() => {
    if (!data?.nodes?.length) return 560;
    const perNodeVerticalAllowance = 140;
    const baseHeight = maxNodesInOneColumn * perNodeVerticalAllowance;
    return Math.max(560, baseHeight);
  }, [data, maxNodesInOneColumn]);

  const dynamicNodePadding = useMemo(() => {
    if (maxNodesInOneColumn <= 3) return 120;
    if (maxNodesInOneColumn <= 4) return 108;
    if (maxNodesInOneColumn <= 6) return 92;
    return 80;
  }, [maxNodesInOneColumn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setViewportHeight(window.innerHeight || 0);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const containerHeight = useMemo(() => {
    const minVh = viewportHeight ? Math.floor(viewportHeight * 0.7) : 0;
    return Math.max(560, chartHeight, minVh);
  }, [chartHeight, viewportHeight]);
  useEffect(() => {
    if (activeLink === null) {
      updateTooltip({ visible: false });
    }
  }, [activeLink, updateTooltip]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!tooltip.visible) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

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

      return (
        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}>
          <Rectangle
            x={x}
            y={y}
            width={width}
            height={height}
            fill={primaryFill}
            fillOpacity={0.95}
            stroke={borderColor}
            strokeOpacity={0.2}
            radius={1}
          />
          <NodeLabel x={x} y={y} width={width} height={height} url={payload.name} count={payload.totalTraffic} />
        </g>
      );
    };
    Component.displayName = 'CustomNode';
    return Component;
  }, [borderColor, primaryColor]);

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

      const sourceName = payload?.source?.name ?? '';
      const targetName = payload?.target?.name ?? '';

      const linkBaseColor = isDarkMode ? '#737373' : secondaryColor;
      const linkHoverColor = primaryColor;

      return (
        <g aria-label={`${sourceName} to ${targetName}`}>
          <path
            d={`
              M${sourceX},${sourceY}
              C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
            `}
            fill='none'
            stroke={activeLink === index ? linkHoverColor : linkBaseColor}
            strokeWidth={linkWidth}
            strokeOpacity={activeLink !== null && activeLink !== index ? 0.25 : 0.7}
            strokeLinecap='butt'
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActiveLink(null)}
            style={{ pointerEvents: 'stroke' }}
          />
        </g>
      );
    };
    Component.displayName = 'CustomLink';
    return Component;
  }, [activeLink, isDarkMode, primaryColor, secondaryColor, updateTooltip]);

  const TooltipComponent = useMemo(() => {
    if (!tooltip.visible || !tooltip.content) return null;

    return (
      <div
        className='absolute z-10'
        style={{
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          pointerEvents: 'none',
        }}
      >
        <div className='border-border bg-popover/95 animate-in fade-in-0 zoom-in-95 min-w-[220px] rounded-xl border p-3 shadow-2xl backdrop-blur-sm duration-200'>
          <div className='space-y-1.5'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-popover-foreground text-sm'>
                {tooltip.content.source} → {tooltip.content.target}
              </span>
            </div>
            <div className='text-popover-foreground/80 text-xs'>
              {t('sessions')}: {formatNumber(tooltip.content.value)}
            </div>
          </div>
        </div>
      </div>
    );
  }, [tooltip.visible, tooltip.content, tooltip.x, tooltip.y]);

  return (
    <div className='w-full'>
      <div
        className='relative w-full'
        style={{ height: `${containerHeight}px`, minHeight: '560px' }}
        ref={containerRef}
      >
        <ResponsiveContainer width='100%' height='100%'>
          <Sankey
            data={data}
            node={CustomNode}
            link={CustomLink}
            margin={{ top: 32, right: 260, bottom: 40, left: 24 }}
            nodePadding={dynamicNodePadding}
            nodeWidth={20}
            iterations={96}
            linkCurvature={0.6}
            sort={false}
          />
        </ResponsiveContainer>

        {TooltipComponent}
      </div>
    </div>
  );
}

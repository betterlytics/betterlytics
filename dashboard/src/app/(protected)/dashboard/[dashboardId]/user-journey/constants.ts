// ============================================
// COLOR MAP - Customize colors here
// ============================================
export const COLORS = {
  node: {
    fill: 'var(--sankey-node-fill)',
    stroke: 'var(--sankey-node-stroke)',
    strokeWidth: 1,
    mutedFill: 'var(--sankey-node-fill-muted)',
    mutedStroke: 'var(--sankey-node-stroke-muted)',
  },
  link: {
    stroke: 'var(--sankey-link-stroke)',
    strokeMiddle: 'var(--sankey-link-stroke-middle)',

    highlightStroke: 'var(--sankey-link-highlight)',
    highlightStrokeMiddle: 'var(--sankey-link-highlight-middle)',

    mutedStroke: 'var(--sankey-link-muted)',
    mutedStrokeMiddle: 'var(--sankey-link-muted-middle)',
  },
  card: {
    bg: 'var(--sankey-card-bg)',
    bgMuted: 'var(--sankey-card-bg-muted)',
    bgHighlight: 'var(--sankey-card-bg-highlight)',
    border: 'var(--sankey-card-border)',
    borderMuted: 'var(--sankey-card-border-muted)',
    borderHighlight: 'var(--sankey-card-border-highlight)',
    text: 'var(--foreground)',
    textMuted: 'var(--muted-foreground)',
  },
};

// ============================================
// LAYOUT CONFIGURATION
// ============================================
export const LAYOUT = {
  padding: { top: 20, right: 20, bottom: 24, left: 20 },
  nodeWidth: 14,
  nodeRadius: 2,
  minNodeHeight: 6,
  compressionThreshold: 60,
  maxNodeHeight: 100,
};

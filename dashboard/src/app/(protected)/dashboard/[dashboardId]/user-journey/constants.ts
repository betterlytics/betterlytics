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
  nodeWidth: 16,
  nodeRadius: 2,
  minNodeHeight: 8,
  nodeHeightRatio: 0.5,
  linkGapRatio: 0, // Gap between links as a ratio of available space
};

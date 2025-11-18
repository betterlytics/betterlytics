export const MAP_VISITOR_COLORS = {
  NO_VISITORS: 'var(--graph-fill-none)',
  LOW_VISITORS: 'var(--graph-fill-low)',
  MEDIUM_VISITORS: 'var(--graph-fill-medium)',
  HIGH_VISITORS: 'var(--graph-fill-high)',
} as const;

export const MAP_FEATURE_BORDER_COLORS = {
  NO_VISITORS: 'var(--map-feature-border-none)',
  LOW_VISITORS: 'var(--map-feature-border-low)',
  MEDIUM_VISITORS: 'var(--map-feature-border-medium)',
  HIGH_VISITORS: 'var(--map-feature-border-high)',
  HOVERED: 'var(--map-feature-border-hovered)',
  CLICKED: 'var(--map-feature-border-clicked)',
} as const;

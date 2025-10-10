export const MAP_VISITOR_COLORS = {
  NO_VISITORS: 'var(--graph-fill-none)', // Gray for 0 visitors
  LOW_VISITORS: 'var(--graph-fill-low)', // Light blue for high visitor counts
  MEDIUM_VISITORS: 'var(--graph-fill-medium)', // Medium blue for medium visitor counts
  HIGH_VISITORS: 'var(--graph-fill-high)', // Dark blue for low visitor counts
} as const;

export const MAP_FEATURE_BORDER_COLORS = {
  NO_VISITORS: 'var(--map-feature-border-none)', // Lighter gray for 0 visitors border
  LOW_VISITORS: 'var(--map-feature-border-low)', // Lighter version of light blue
  MEDIUM_VISITORS: 'var(--map-feature-border-medium)', // Medium blue border
  HIGH_VISITORS: 'var(--map-feature-border-high)', // Lighter version of dark blue
  HOVERED: 'var(--map-feature-border-hovered)',
  CLICKED: 'var(--map-feature-border-clicked)',
} as const;

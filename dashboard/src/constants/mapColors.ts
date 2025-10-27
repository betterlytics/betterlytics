export const MAP_VISITOR_COLORS = {
  NO_VISITORS: '#6b7280', // Gray for 0 visitors
  LOW_VISITORS: '#60a5fa', // Light blue for high visitor counts
  HIGH_VISITORS: '#1e40af', // Dark blue for low visitor counts
  HOVERED: 'var(--map-feature-hovered)',
} as const;

export const MAP_FEATURE_BORDER_COLORS = {
  NO_VISITORS: '#9ca3af', // Lighter gray for 0 visitors border
  LOW_VISITORS: '#93c5fd', // Lighter version of light blue
  HIGH_VISITORS: '#3b82f6', // Lighter version of dark blue
  CLICKED: 'var(--map-feature-border-clicked)',
  HOVERED: 'var(--map-feature-border-hovered)',
} as const;

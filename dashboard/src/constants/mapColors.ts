export const MAP_VISITOR_COLORS = {
  NO_VISITORS: '#6b7280', // Gray for 0 visitors
  LOW_VISITORS: '#60a5fa', // Light blue for high visitor counts
  MEDIUM_VISITORS: '#3b82f6', // Medium blue for medium visitor counts
  HIGH_VISITORS: '#1e40af', // Dark blue for low visitor counts
} as const;

export const MAP_FEATURE_BORDER_COLORS = {
  NO_VISITORS: '#9ca3af', // Lighter gray for 0 visitors border
  LOW_VISITORS: '#93c5fd', // Lighter version of light blue
  MEDIUM_VISITORS: '#60a5fa', // Medium blue border
  HIGH_VISITORS: '#3b82f6', // Lighter version of dark blue
  HOVERED: 'var(--map-feature-border-hovered)',
  CLICKED: 'var(--map-feature-border-clicked)',
} as const;

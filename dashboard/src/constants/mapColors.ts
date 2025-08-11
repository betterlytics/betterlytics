export const MAP_VISITOR_COLORS = {
  NO_VISITORS: '#6b7280', // Gray for 0 visitors
  HIGH_VISITORS: '#60a5fa', // Light blue for high visitor counts
  LOW_VISITORS: '#1e40af', // Dark blue for low visitor counts
} as const;

export const MAP_FEATURE_BORDER_COLORS = {
  NO_VISITORS: '#9ca3af', // Lighter gray for 0 visitors border
  HIGH_VISITORS: '#93c5fd', // Lighter version of light blue
  LOW_VISITORS: '#3b82f6', // Lighter version of dark blue
  HOVERED: 'var(--chart-3)', // Consider --chart-3
  SELECTED: 'var(--chart-4)', // Consider --chart-4
} as const;

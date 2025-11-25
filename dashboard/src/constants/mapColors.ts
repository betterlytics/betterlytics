export const MAP_VISITOR_COLORS = {
  NO_VISITORS: '--graph-fill-none',
  LOW_VISITORS: '--graph-fill-low',
  MEDIUM_VISITORS: '--graph-fill-medium',
  HIGH_VISITORS: '--graph-fill-high',
} as const;

export const MAP_FEATURE_BORDER_COLORS = {
  NO_VISITORS: '--map-feature-border-none',
  LOW_VISITORS: '--map-feature-border-low',
  MEDIUM_VISITORS: '--map-feature-border-medium',
  HIGH_VISITORS: '--map-feature-border-high',
  HOVERED: '--map-feature-border-hovered',
  CLICKED: '--map-feature-border-clicked',
} as const;

export function cssVar(variableName: `--${string}`): string {
  return `var(${variableName})`;
}

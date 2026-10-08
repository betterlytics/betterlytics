import type { CSSProperties } from 'react';

export function vars(values: Record<`--${string}`, string | number>): CSSProperties {
  return values as CSSProperties;
}

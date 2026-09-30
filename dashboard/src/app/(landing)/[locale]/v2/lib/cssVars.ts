import type { CSSProperties } from 'react';

/** Inline custom properties (`--share`, `--d`, …) that hand values from the script to a stylesheet. */
export function vars(values: Record<`--${string}`, string | number>): CSSProperties {
  return values as CSSProperties;
}

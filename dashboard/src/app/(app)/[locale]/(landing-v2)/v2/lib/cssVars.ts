import type { CSSProperties } from 'react';

/** Inline custom properties (`--d`, `--i`, …) that the stylesheet's staggered transitions read. */
export function vars(values: Record<`--${string}`, string | number>, rest?: CSSProperties): CSSProperties {
  return { ...rest, ...values } as CSSProperties;
}

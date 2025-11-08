export const COMPARE_URL_MODES = ['previous', 'year', 'off', 'custom'] as const;
export type CompareMode = (typeof COMPARE_URL_MODES)[number];

export function isDerivedCompareMode(mode: CompareMode): mode is 'previous' | 'year' {
  return mode === 'previous' || mode === 'year';
}

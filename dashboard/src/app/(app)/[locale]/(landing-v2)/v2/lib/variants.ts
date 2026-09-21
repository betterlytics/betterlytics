/**
 * Layout variants of the "one script" section, switchable from the floating
 * toggle while the design is being decided. Remove once one is chosen.
 */
export const VARIANTS = [
  { id: 'board', label: 'Board', hint: 'Four stat tiles over a ruled framework board' },
  { id: 'bento', label: 'Bento', hint: 'Label cell introducing four illustrated stat cards' },
  { id: 'snippet', label: 'Snippet', hint: 'The install snippet with framework tabs beside stacked stats' },
] as const;

export type VariantId = (typeof VARIANTS)[number]['id'];
export const DEFAULT_VARIANT: VariantId = 'snippet';
export const VARIANT_KEY = 'lp2-variant';

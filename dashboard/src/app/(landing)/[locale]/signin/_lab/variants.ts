/** The sign-in directions under review, grouped by family, in the order the switcher shows them. */
export const VARIANTS = [
  { slug: 'volt', letter: 'A', name: 'Volt', blurb: 'Split, with the hero’s blue card' },
  { slug: 'eclipse', letter: 'A2', name: 'Eclipse', blurb: 'Volt, with the card in deep space' },
  { slug: 'corona', letter: 'A3', name: 'Corona', blurb: 'Eclipse, drawn by a fragment shader' },
  { slug: 'linework', letter: 'B2', name: 'Linework', blurb: 'The landing’s panel and construction lines' },
  { slug: 'horizon', letter: 'C', name: 'Horizon', blurb: 'Minimal, lit from below' },
  { slug: 'aurora', letter: 'C2', name: 'Aurora', blurb: 'Horizon, lit in the hero’s blue' },
  { slug: 'orbit', letter: 'C3', name: 'Orbit', blurb: 'Aurora, with faint stars above the horizon' },
  { slug: 'dawn', letter: 'C4', name: 'Dawn', blurb: 'Orbit, drawn by a fragment shader' },
  { slug: 'still', letter: 'C5', name: 'Still', blurb: 'Horizon with no light: the form alone' },
  { slug: 'afterglow', letter: 'C6', name: 'Afterglow', blurb: 'Aurora, drawn by a fragment shader' },
  { slug: 'meridian', letter: 'D2', name: 'Meridian', blurb: 'A quiet globe with the landing’s live arrivals' },
  { slug: 'atlas', letter: 'D3', name: 'Atlas', blurb: 'Meridian, drawn in Linework’s lines' },
] as const;

export type VariantSlug = (typeof VARIANTS)[number]['slug'];

export function isVariantSlug(value: string): value is VariantSlug {
  return VARIANTS.some((variant) => variant.slug === value);
}

export const PREVIEW_STATES = [
  { key: null, label: 'Default' },
  { key: 'error', label: 'Wrong password' },
  { key: 'otp', label: 'Two-factor step' },
  { key: 'loading', label: 'Signing in' },
] as const;

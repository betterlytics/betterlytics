export const STEPS = ['select', 'customize', 'publish'] as const;
export type Step = (typeof STEPS)[number];

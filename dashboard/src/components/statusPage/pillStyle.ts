export type PillTone = 'ok' | 'warn' | 'partial' | 'down' | 'neutral';

export function pillStyle(tone: PillTone): { color: string; background: string; borderColor: string } {
  return {
    color: `var(--sp-pill-${tone}-text)`,
    background: `var(--sp-pill-${tone}-bg)`,
    borderColor: `var(--sp-pill-${tone}-border)`,
  };
}

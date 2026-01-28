/**
 * Token types and utilities for NumberRoll Intl.NumberFormat integration
 *
 * Algorithm (pure position-based):
 * 1. Right-align old and new tokens by position
 * 2. Aligned positions: same type+value = idle, same type+diff value = animate, diff type = exit+enter
 * 3. Extra new positions = entering
 * 4. Extra old positions = exiting
 */

export type TokenType = 'digit' | 'symbol';
export type TokenPhase = 'idle' | 'entering' | 'exiting' | 'animating';

export type Token = {
  id: string;
  type: TokenType;
  value: string;
  phase: TokenPhase;
  fromValue?: string;
};

const isDigitPart = (part: Intl.NumberFormatPart): boolean =>
  part.type === 'integer' || part.type === 'fraction' || part.type === 'exponentInteger';

const commitTokens = (tokens: Token[]): Token[] =>
  tokens
    .filter((t) => t.phase !== 'exiting')
    .map((t) => ({ ...t, phase: 'idle' as TokenPhase, fromValue: undefined }));

const flattenParts = (parts: Intl.NumberFormatPart[]): { type: TokenType; value: string }[] => {
  const result: { type: TokenType; value: string }[] = [];
  for (const part of parts) {
    if (isDigitPart(part)) {
      for (const char of part.value) {
        result.push({ type: 'digit', value: char });
      }
    } else {
      result.push({ type: 'symbol', value: part.value });
    }
  }
  return result;
};

export const diffTokens = (
  prevTokens: Token[],
  nextParts: Intl.NumberFormatPart[],
): Token[] => {
  const committed = commitTokens(prevTokens);
  const nextFlat = flattenParts(nextParts);

  const resultTokens: Token[] = [];
  const maxLen = Math.max(committed.length, nextFlat.length);

  for (let i = 0; i < maxLen; i++) {
    const prevIdx = committed.length - maxLen + i;
    const nextIdx = nextFlat.length - maxLen + i;

    const prevToken = prevIdx >= 0 ? committed[prevIdx] : null;
    const nextItem = nextIdx >= 0 ? nextFlat[nextIdx] : null;

    if (nextItem && prevToken) {
      if (prevToken.type === nextItem.type) {
        if (prevToken.value === nextItem.value) {
          resultTokens.push({ ...prevToken, phase: 'idle' });
        } else {
          resultTokens.push({
            ...prevToken,
            value: nextItem.value,
            phase: 'animating',
            fromValue: prevToken.value,
          });
        }
      } else {
        resultTokens.push({ ...prevToken, phase: 'exiting' });
        resultTokens.push({
          id: crypto.randomUUID(),
          type: nextItem.type,
          value: nextItem.value,
          phase: 'entering',
        });
      }
    } else if (nextItem) {
      resultTokens.push({
        id: crypto.randomUUID(),
        type: nextItem.type,
        value: nextItem.value,
        phase: 'entering',
      });
    } else if (prevToken) {
      resultTokens.push({ ...prevToken, phase: 'exiting' });
    }
  }

  return resultTokens;
};

/**
 * Convert a Part to initial tokens.
 */
const partToTokens = (part: Intl.NumberFormatPart, phase: TokenPhase): Token[] => {
  if (isDigitPart(part)) {
    return part.value.split('').map((char) => ({
      id: crypto.randomUUID(),
      type: 'digit' as TokenType,
      value: char,
      phase,
      fromValue: phase === 'entering' ? '0' : undefined,
    }));
  }
  return [
    {
      id: crypto.randomUUID(),
      type: 'symbol' as TokenType,
      value: part.value,
      phase,
    },
  ];
};

/**
 * Create initial tokens from parts (all idle).
 */
export const createInitialTokens = (parts: Intl.NumberFormatPart[]): Token[] =>
  parts.flatMap((part) => partToTokens(part, 'idle'));

/**
 * Digit definitions
 */
export const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type Digit = (typeof DIGITS)[number];

export type DigitPhase = 'idle' | 'animating' | 'entering' | 'exiting';

/**
 * Token types and utilities for NumberRoll Intl.NumberFormat integration
 * 
 * Algorithm: 
 * 1. Group previous tokens by their corresponding Intl.NumberFormatPart structure.
 * 2. Zip previous parts (groups) and next parts, aligned from the right.
 * 3. Diff content within matched parts:
 *    - For digit parts (integer/fraction), zip and diff digits from the right.
 *    - For symbol parts, emit exit/enter if values differ.
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

const isDigitPart = (part: Intl.NumberFormatPart | { type: string }): boolean =>
  part.type === 'integer' || part.type === 'fraction';

/**
 * Right-align and zip two arrays.
 */
function rightAlignZip<A, B>(prev: A[], next: B[]): [A | null, B | null][] {
  const maxLen = Math.max(prev.length, next.length);
  return Array.from({ length: maxLen }, (_, i) => [
    prev[prev.length - maxLen + i] ?? null,
    next[next.length - maxLen + i] ?? null,
  ]);
}

/**
 * Normalizes state before a new diff: entering/animating -> idle, remove exiting.
 */
const commitTokens = (tokens: Token[]): Token[] =>
  tokens
    .filter(t => t.phase !== 'exiting')
    .map(t => ({ ...t, phase: 'idle' as TokenPhase, fromValue: undefined }));

/**
 * Group tokens by their original part structure.
 */
type TokenGroup = { type: string; tokens: Token[] };

function groupTokensByPart(tokens: Token[], parts: Intl.NumberFormatPart[]): TokenGroup[] {
  let tokenIdx = 0;
  const groups = parts.map(part => {
    // Digits parts can have multiple characters, symbols are treated as 1 token in our system
    // (even if Intl.NumberFormatPart.value has multiple chars, like "US$")
    const len = isDigitPart(part) ? part.value.length : 1;
    const groupTokens = tokens.slice(tokenIdx, tokenIdx + len);
    tokenIdx += len;
    return { type: part.type, tokens: groupTokens };
  });

  // Catch any drifting tokens as their own group
  if (tokenIdx < tokens.length) {
    groups.push({ type: 'unknown', tokens: tokens.slice(tokenIdx) });
  }
  return groups;
}

/**
 * Diff individual character strings into tokens.
 */
function diffDigitChars(prevTokens: Token[], nextChars: string[]): Token[] {
  return rightAlignZip(prevTokens, nextChars).flatMap(([prev, next]) => {
    if (!prev && next) {
      return [{
        id: crypto.randomUUID(),
        type: 'digit',
        value: next,
        phase: 'entering' as TokenPhase,
        fromValue: '0',
      }];
    }
    if (prev && !next) {
      return [{ ...prev, phase: 'exiting' as TokenPhase }];
    }
    if (prev && next) {
      if (prev.value !== next) {
        return [{
          ...prev,
          value: next,
          phase: 'animating' as TokenPhase,
          fromValue: prev.value,
        }];
      }
      return [{ ...prev, phase: 'idle' as TokenPhase }];
    }
    return [];
  });
}

/**
 * Convert a Part to initial tokens.
 */
const partToTokens = (part: Intl.NumberFormatPart, phase: TokenPhase): Token[] => {
  if (isDigitPart(part)) {
    return part.value.split('').map(char => ({
      id: crypto.randomUUID(),
      type: 'digit',
      value: char,
      phase,
      fromValue: phase === 'entering' ? '0' : undefined,
    }));
  }
  return [{
    id: crypto.randomUUID(),
    type: 'symbol',
    value: part.value,
    phase,
  }];
};

/**
 * Main diff function.
 */
export const diffTokens = (
  prevTokens: Token[],
  prevParts: Intl.NumberFormatPart[],
  nextParts: Intl.NumberFormatPart[]
): Token[] => {
  const committed = commitTokens(prevTokens);
  const prevGroups = groupTokensByPart(committed, prevParts);

  return rightAlignZip(prevGroups, nextParts).flatMap(([prevGroup, nextPart]) => {
    // Entering part
    if (!prevGroup && nextPart) {
      return partToTokens(nextPart, 'entering');
    }

    // Exiting part
    if (prevGroup && !nextPart) {
      return prevGroup.tokens.map(t => ({ ...t, phase: 'exiting' as TokenPhase }));
    }

    // Both parts exist at this right-aligned position
    if (prevGroup && nextPart) {
      const prevIsDigit = isDigitPart(prevGroup);
      const nextIsDigit = isDigitPart(nextPart);

      // Both are digit parts - align and diff content
      if (prevIsDigit && nextIsDigit) {
        return diffDigitChars(prevGroup.tokens, nextPart.value.split(''));
      }

      // Both are symbols
      if (!prevIsDigit && !nextIsDigit) {
        // Same value - reuse
        if (prevGroup.tokens[0]?.value === nextPart.value) {
          return [{ ...prevGroup.tokens[0], phase: 'idle' as TokenPhase }];
        }
        // Different symbol - animate single token with fromValue for cross-fade
        return [{
          ...prevGroup.tokens[0],
          value: nextPart.value,
          phase: 'animating' as TokenPhase,
          fromValue: prevGroup.tokens[0].value,
        }];
      }

      // Type mismatch (e.g. digit replaced by symbol) - exit old, enter new
      return [
        ...prevGroup.tokens.map(t => ({ ...t, phase: 'exiting' as TokenPhase })),
        ...partToTokens(nextPart, 'entering'),
      ];
    }

    return [];
  });
};

/**
 * Create initial tokens from parts (all idle).
 */
export const createInitialTokens = (parts: Intl.NumberFormatPart[]): Token[] =>
  parts.flatMap(part => partToTokens(part, 'idle'));

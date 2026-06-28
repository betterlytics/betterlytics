/**
 * Visual-width helpers for truncating display strings.
 *
 * Counting `String.length` (UTF-16 code units) is wrong for any non-Latin
 * script: a CJK ideograph such as 家 is a single code unit but renders at
 * roughly twice the advance width of a Latin glyph, and many emoji are
 * surrogate pairs (length 2) yet render as one wide cell. We instead measure
 * in "columns" using the Unicode East Asian Width property (Wide/Fullwidth = 2,
 * everything else = 1) and slice on grapheme boundaries so we never cut a
 * surrogate pair, flag, or combining sequence in half.
 */

/* East Asian Width = Wide (W) or Fullwidth (F), ascending by code point. */
const WIDE_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x1100, 0x115f],
  [0x2329, 0x232a],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xa960, 0xa97f],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1b000, 0x1b16f],
  [0x1f200, 0x1f2ff],
  [0x1f300, 0x1faff],
  [0x20000, 0x3fffd],
];

function isWideCodePoint(codePoint: number): boolean {
  for (const [start, end] of WIDE_RANGES) {
    if (codePoint < start) return false;
    if (codePoint <= end) return true;
  }
  return false;
}

/** Width in columns of a single grapheme cluster: 2 for wide/emoji, else 1. */
function graphemeWidth(grapheme: string): number {
  for (const char of grapheme) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;
    const isEmojiPresentation = codePoint === 0xfe0f;
    const isRegionalIndicator = codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
    if (isEmojiPresentation || isRegionalIndicator || isWideCodePoint(codePoint)) {
      return 2;
    }
  }
  return 1;
}

function segmentGraphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), (entry) => entry.segment);
  }
  return Array.from(value);
}

/** Total rendered width of a string in columns. */
export function getStringWidth(value: string): number {
  return segmentGraphemes(value).reduce((total, grapheme) => total + graphemeWidth(grapheme), 0);
}

/**
 * Take whole grapheme clusters from the start (or end) of `value` until adding
 * the next one would exceed `maxWidth` columns. Never splits a cluster.
 */
export function sliceToWidth(value: string, maxWidth: number, fromEnd = false): string {
  const graphemes = segmentGraphemes(value);
  const ordered = fromEnd ? [...graphemes].reverse() : graphemes;

  const taken: string[] = [];
  let width = 0;
  for (const grapheme of ordered) {
    const next = width + graphemeWidth(grapheme);
    if (next > maxWidth) break;
    taken.push(grapheme);
    width = next;
  }

  return (fromEnd ? taken.reverse() : taken).join('');
}

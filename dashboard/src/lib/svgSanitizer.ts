/**
 * Strict sanitizer for owner-uploaded SVG logos.
 *
 * Philosophy: reject, don't clean. Anything outside a tight allowlist of elements and
 * attributes — or any construct we can't fully account for (DOCTYPE, entities, CDATA,
 * processing instructions, external references) — fails the whole file. Accepted files are
 * re-serialized from the parsed tree, so the stored bytes are always our own output and
 * parser-differential tricks in the original markup can't survive.
 *
 * This is deliberately narrower than general-purpose SVG: it targets logo exports
 * (paths, shapes, gradients, clips, simple text). Extend the allowlists as real logos
 * demand, not preemptively.
 *
 * Sanitization is one of three layers — logos only ever render via <img> (scripts can
 * never run there), and the image route serves SVG with `CSP: default-src 'none'` +
 * `Content-Disposition: attachment` so direct navigation downloads instead of rendering.
 *
 * Pure TS (no Node/browser-only APIs): runs in the upload UI for instant feedback and in
 * the server action as the authority.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

const MAX_NODES = 2000;
const MAX_DEPTH = 32;

const ALLOWED_ELEMENTS = new Set([
  'svg',
  'g',
  'defs',
  'title',
  'desc',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'use',
  'symbol',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'pattern',
  'filter',
  'feGaussianBlur',
  'feOffset',
  'feBlend',
  'feColorMatrix',
  'feComposite',
  'feFlood',
  'feMerge',
  'feMergeNode',
  'feDropShadow',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'id',
  'class',
  'xmlns',
  'xmlns:xlink',
  'xml:space',
  'version',
  'viewBox',
  'preserveAspectRatio',
  'width',
  'height',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'dx',
  'dy',
  'd',
  'points',
  'transform',
  'gradientTransform',
  'gradientUnits',
  'patternTransform',
  'patternUnits',
  'patternContentUnits',
  'spreadMethod',
  'offset',
  'href',
  'xlink:href',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-opacity',
  'opacity',
  'color',
  'stop-color',
  'stop-opacity',
  'clip-path',
  'clip-rule',
  'clipPathUnits',
  'mask',
  'maskUnits',
  'maskContentUnits',
  'filter',
  'filterUnits',
  'primitiveUnits',
  'style',
  'display',
  'visibility',
  'overflow',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'text-anchor',
  'dominant-baseline',
  'baseline-shift',
  'vector-effect',
  'shape-rendering',
  'stdDeviation',
  'flood-color',
  'flood-opacity',
  'in',
  'in2',
  'result',
  'mode',
  'type',
  'values',
  'operator',
  'k1',
  'k2',
  'k3',
  'k4',
  'aria-hidden',
  'role',
  'focusable',
]);

type SvgElement = { name: string; attrs: Array<[string, string]>; children: Array<SvgElement | { text: string }> };

class RejectedError extends Error {}
const reject = (): never => {
  throw new RejectedError();
};

const NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*(:[A-Za-z][A-Za-z0-9_-]*)?$/;
const LOCAL_REF_PATTERN = /^#[A-Za-z_][A-Za-z0-9_.-]*$/;
// XML-invalid control characters; also nothing an attacker can smuggle meaning through.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;

function decodeCodePoint(code: number): string {
  if (!Number.isInteger(code) || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) reject();
  const char = String.fromCodePoint(code);
  if (CONTROL_CHARS.test(char)) reject();
  return char;
}

/** Decode the five XML built-ins + numeric refs; any other `&` sequence rejects the file. */
function decodeEntities(raw: string): string {
  if (!raw.includes('&')) return raw;
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '&') {
      out += raw[i];
      continue;
    }
    const semi = raw.indexOf(';', i);
    if (semi === -1) reject();
    const entity = raw.slice(i + 1, semi);
    if (entity === 'amp') out += '&';
    else if (entity === 'lt') out += '<';
    else if (entity === 'gt') out += '>';
    else if (entity === 'quot') out += '"';
    else if (entity === 'apos') out += "'";
    else if (/^#[0-9]{1,7}$/.test(entity)) out += decodeCodePoint(parseInt(entity.slice(1), 10));
    else if (/^#x[0-9A-Fa-f]{1,6}$/.test(entity)) out += decodeCodePoint(parseInt(entity.slice(2), 16));
    else reject();
    i = semi;
  }
  return out;
}

function validateAttribute(name: string, value: string): void {
  if (!ALLOWED_ATTRIBUTES.has(name)) reject();
  if (CONTROL_CHARS.test(value)) reject();

  if (name === 'xmlns') {
    if (value !== SVG_NS) reject();
    return;
  }
  if (name === 'xmlns:xlink') {
    if (value !== XLINK_NS) reject();
    return;
  }
  // References may only point inside the document.
  if (name === 'href' || name === 'xlink:href') {
    if (!LOCAL_REF_PATTERN.test(value)) reject();
    return;
  }
  // style is CSS: no escapes (\), at-rules (@) or markup — those are where CSS smuggling lives.
  if (name === 'style' && /[\\@<]/.test(value)) reject();

  const lower = value.toLowerCase();
  if (lower.includes('javascript:') || lower.includes('data:')) reject();
  // Every url(...) — fill, clip-path, filter, style — must be a local fragment reference.
  let idx = 0;
  while ((idx = lower.indexOf('url(', idx)) !== -1) {
    const rest = value.slice(idx + 4).trimStart();
    if (!(rest.startsWith('#') || rest.startsWith('"#') || rest.startsWith("'#"))) reject();
    idx += 4;
  }
}

function parse(source: string): SvgElement {
  let pos = 0;
  let nodeCount = 0;

  const skipWhitespace = () => {
    while (pos < source.length && /\s/.test(source[pos])) pos++;
  };

  const skipComment = (): boolean => {
    if (!source.startsWith('<!--', pos)) return false;
    const end = source.indexOf('-->', pos + 4);
    if (end === -1) reject();
    pos = end + 3;
    return true;
  };

  const readName = (): string => {
    const start = pos;
    while (pos < source.length && /[A-Za-z0-9:_-]/.test(source[pos])) pos++;
    const name = source.slice(start, pos);
    if (!NAME_PATTERN.test(name)) reject();
    return name;
  };

  const parseElement = (depth: number): SvgElement => {
    if (depth > MAX_DEPTH || ++nodeCount > MAX_NODES) reject();
    pos++;
    const name = readName();
    if (!ALLOWED_ELEMENTS.has(name)) reject();

    const attrs: Array<[string, string]> = [];
    for (;;) {
      const beforeWs = pos;
      skipWhitespace();
      if (source[pos] === '>') {
        pos++;
        break;
      }
      if (source.startsWith('/>', pos)) {
        pos += 2;
        return { name, attrs, children: [] };
      }
      if (pos === beforeWs || pos >= source.length) reject();

      const attrName = readName();
      skipWhitespace();
      if (source[pos] !== '=') reject();
      pos++;
      skipWhitespace();
      const quote = source[pos];
      if (quote !== '"' && quote !== "'") reject();
      pos++;
      const valueEnd = source.indexOf(quote, pos);
      if (valueEnd === -1) reject();
      const rawValue = source.slice(pos, valueEnd);
      pos = valueEnd + 1;
      if (rawValue.includes('<')) reject();

      const value = decodeEntities(rawValue);
      validateAttribute(attrName, value);
      if (attrs.some(([existing]) => existing === attrName)) reject();
      attrs.push([attrName, value]);
    }

    const children: SvgElement['children'] = [];
    for (;;) {
      if (pos >= source.length) reject();
      if (source.startsWith('</', pos)) {
        pos += 2;
        const closing = readName();
        skipWhitespace();
        if (source[pos] !== '>') reject();
        pos++;
        if (closing !== name) reject();
        return { name, attrs, children };
      }
      if (skipComment()) continue;
      if (source[pos] === '<') {
        // Any markup declaration or processing instruction inside the tree is hostile territory.
        if (source[pos + 1] === '!' || source[pos + 1] === '?') reject();
        children.push(parseElement(depth + 1));
        continue;
      }
      const nextTag = source.indexOf('<', pos);
      if (nextTag === -1) reject();
      const text = decodeEntities(source.slice(pos, nextTag));
      if (CONTROL_CHARS.test(text)) reject();
      pos = nextTag;
      if (text.trim().length > 0) children.push({ text });
    }
  };

  skipWhitespace();
  if (source.startsWith('<?xml', pos)) {
    const end = source.indexOf('?>', pos);
    if (end === -1) reject();
    pos = end + 2;
  }
  for (;;) {
    skipWhitespace();
    if (!skipComment()) break;
  }
  if (source[pos] !== '<') reject();
  const root = parseElement(0);
  for (;;) {
    skipWhitespace();
    if (!skipComment()) break;
  }
  if (pos !== source.length) reject();
  return root;
}

const escapeText = (value: string) =>
  value.replace(/[&<>]/g, (char) => (char === '&' ? '&amp;' : char === '<' ? '&lt;' : '&gt;'));
const escapeAttr = (value: string) =>
  value.replace(/[&<>"]/g, (char) =>
    char === '&' ? '&amp;' : char === '<' ? '&lt;' : char === '>' ? '&gt;' : '&quot;',
  );

function serialize(node: SvgElement): string {
  const attrs = node.attrs.map(([name, value]) => ` ${name}="${escapeAttr(value)}"`).join('');
  if (node.children.length === 0) return `<${node.name}${attrs}/>`;
  const inner = node.children
    .map((child) => ('text' in child ? escapeText(child.text) : serialize(child)))
    .join('');
  return `<${node.name}${attrs}>${inner}</${node.name}>`;
}

export function looksLikeSvg(bytes: Uint8Array): boolean {
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(bytes.slice(0, 1024))
    .replace(/^\uFEFF/, '')
    .trimStart();
  return head.startsWith('<') && /<svg[\s>/]/.test(head);
}

/**
 * Validate and re-serialize an SVG logo. Returns the bytes to store, or null when the
 * file contains anything outside the allowlist (the caller should reject the upload).
 */
export function sanitizeSvgLogo(bytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
  source = source.replace(/^\uFEFF/, '');

  try {
    const root = parse(source);
    if (root.name !== 'svg') reject();
    const has = (attr: string) => root.attrs.some(([name]) => name === attr);
    // Without intrinsic geometry the browser can't derive an aspect ratio for <img>.
    if (!has('viewBox') && !(has('width') && has('height'))) reject();
    if (!has('xmlns')) root.attrs.unshift(['xmlns', SVG_NS]);
    // Copy into a fresh array so the result is typed over a plain ArrayBuffer (BlobPart-compatible).
    return new Uint8Array(new TextEncoder().encode(serialize(root)));
  } catch (error) {
    if (error instanceof RejectedError) return null;
    throw error;
  }
}

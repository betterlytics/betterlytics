import { describe, expect, it } from 'vitest';
import { looksLikeSvg, sanitizeSvgLogo } from './svgSanitizer';

const encode = (svg: string) => new TextEncoder().encode(svg);
const sanitize = (svg: string): string | null => {
  const result = sanitizeSvgLogo(encode(svg));
  return result ? new TextDecoder().decode(result) : null;
};

const WRAP = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;

describe('sanitizeSvgLogo', () => {
  describe('accepts real-world logo constructs', () => {
    it('accepts a minimal path logo', () => {
      const out = sanitize(WRAP('<path d="M0 0h100v100H0z" fill="#f00"/>'));
      expect(out).toContain('<path d="M0 0h100v100H0z" fill="#f00"/>');
    });

    it('accepts width/height instead of viewBox', () => {
      expect(sanitize('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><rect width="100" height="40"/></svg>')).not.toBeNull();
    });

    it('adds xmlns when missing', () => {
      const out = sanitize('<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>');
      expect(out).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('accepts gradients with local url() references', () => {
      const out = sanitize(
        WRAP(
          '<defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/>',
        ),
      );
      expect(out).toContain('fill="url(#g)"');
    });

    it('accepts use with a local href', () => {
      expect(sanitize(WRAP('<defs><circle id="c" r="5"/></defs><use href="#c"/>'))).not.toBeNull();
      expect(sanitize(WRAP('<defs><circle id="c" r="5"/></defs><use xlink:href="#c"/>'))).not.toBeNull();
    });

    it('accepts text content and decodes/re-encodes entities safely', () => {
      const out = sanitize(WRAP('<title>A &amp; B &lt;quoted&gt;</title><path d="M0 0"/>'));
      expect(out).toContain('<title>A &amp; B &lt;quoted&gt;</title>');
    });

    it('drops the XML prolog and comments', () => {
      const out = sanitize(
        `<?xml version="1.0" encoding="UTF-8"?><!-- exported --><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><!-- shape --><path d="M0 0"/></svg><!-- trailing -->`,
      );
      expect(out).not.toBeNull();
      expect(out).not.toContain('<!--');
      expect(out).not.toContain('<?xml');
    });

    it('accepts a simple style attribute, including local url()', () => {
      expect(sanitize(WRAP('<path d="M0 0" style="fill: #f00; stroke-width: 2"/>'))).not.toBeNull();
      expect(sanitize(WRAP('<path d="M0 0" style="fill: url(#g)"/>'))).not.toBeNull();
    });

    it('accepts a UTF-8 BOM', () => {
      expect(sanitizeSvgLogo(encode('﻿<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>'))).not.toBeNull();
    });
  });

  describe('rejects dangerous or out-of-allowlist content', () => {
    it.each([
      ['script element', WRAP('<script>alert(1)</script>')],
      ['event handler attribute', WRAP('<path d="M0 0" onload="alert(1)"/>')],
      ['foreignObject', WRAP('<foreignObject><body/></foreignObject>')],
      ['image element', WRAP('<image href="https://evil.example/x.png"/>')],
      ['anchor element', WRAP('<a href="#x"><path d="M0 0"/></a>')],
      ['style element', WRAP('<style>path { fill: red }</style><path d="M0 0"/>')],
      ['external href', WRAP('<use href="https://evil.example/#c"/>')],
      ['external xlink:href', WRAP('<use xlink:href="https://evil.example/#c"/>')],
      ['javascript: href', WRAP('<use href="javascript:alert(1)"/>')],
      ['data: href', WRAP('<use href="data:text/html,<script>"/>')],
      ['external url() in fill', WRAP('<rect fill="url(https://evil.example/f.svg#g)"/>')],
      ['external url() in style', WRAP('<rect style="fill: url(https://evil.example)"/>')],
      ['CSS escape smuggling in style', WRAP('<rect style="fill: u\\72l(https://x)"/>')],
      ['at-rule in style', WRAP('<rect style="@import url(#x)"/>')],
      ['DOCTYPE', '<!DOCTYPE svg><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>'],
      [
        'entity declaration (billion laughs)',
        '<!DOCTYPE svg [<!ENTITY a "aaaa">]><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>',
      ],
      ['CDATA section', WRAP('<title><![CDATA[x]]></title>')],
      ['processing instruction in tree', WRAP('<?php echo 1 ?><path d="M0 0"/>')],
      ['custom entity', WRAP('<title>&xxe;</title>')],
      ['unquoted attribute', '<svg viewBox=0><path d="M0 0"/></svg>'],
      ['mismatched close tag', '<svg viewBox="0 0 1 1"><g><path d="M0 0"/></svg></g>'],
      ['trailing content after root', '<svg viewBox="0 0 1 1"><path d="M0 0"/></svg><svg/>'],
      ['non-svg root', '<g><path d="M0 0"/></g>'],
      ['missing viewBox and width/height', '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'],
      ['foreign xmlns', '<svg xmlns="http://evil.example/ns" viewBox="0 0 1 1"><path d="M0 0"/></svg>'],
      ['unknown attribute', WRAP('<path d="M0 0" data-tracking="x"/>')],
      ['html', '<html><body><svg viewBox="0 0 1 1"/></body></html>'],
    ])('rejects %s', (_label, svg) => {
      expect(sanitize(svg)).toBeNull();
    });

    it('rejects files with too many nodes', () => {
      expect(sanitize(WRAP('<rect width="1" height="1"/>'.repeat(2100)))).toBeNull();
    });

    it('rejects nesting deeper than the cap', () => {
      expect(sanitize(WRAP('<g>'.repeat(40) + '<path d="M0 0"/>' + '</g>'.repeat(40)))).toBeNull();
    });

    it('rejects invalid UTF-8', () => {
      expect(sanitizeSvgLogo(new Uint8Array([0x3c, 0x73, 0x76, 0x67, 0xff, 0xfe]))).toBeNull();
    });
  });

  it('re-serializes rather than echoing input bytes', () => {
    const out = sanitize(`<svg   viewBox = "0 0 1 1"\n><path\td='M0 0'/></svg>`);
    expect(out).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><path d="M0 0"/></svg>');
  });
});

describe('looksLikeSvg', () => {
  it('detects svg markup with and without prolog', () => {
    expect(looksLikeSvg(encode('<svg viewBox="0 0 1 1"/>'))).toBe(true);
    expect(looksLikeSvg(encode('<?xml version="1.0"?>\n<svg>'))).toBe(true);
  });

  it('is false for raster magic bytes and plain text', () => {
    expect(looksLikeSvg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(looksLikeSvg(encode('plain text'))).toBe(false);
    expect(looksLikeSvg(encode('<html><body>hi</body></html>'))).toBe(false);
  });
});

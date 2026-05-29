import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  computeTextureRgba,
  gridFor,
  hashStr,
  renderDefaultsFor,
  type PaletteName,
  type TextureName,
} from "./cover-textures";
import { renderTexturePng } from "./cover-raster";
import { pickTexture } from "./cover";
import { type BlogPost } from "./registry";

// =============================================================================
// Cover render core — turns resolved options into the finished 1200×630 PNG
// (procedural texture background + composited chrome via Satori).
//
// Shared by the static per-post route (`/api/blog/cover/[slug]`, prerendered at
// build) and the dynamic tuning playground (`/api/blog/cover?…`). Output is
// deterministic given (texture, seed, params), so it's cached immutably.
// =============================================================================

const W = 1200;
const H = 630;
const CQW = 12; // 1cqw at 1200px wide

// Chrome colors, pre-resolved to hex (Satori's oklch parser falls back to black).
const C = {
  surface: "#f7f7f8",
  border: "#e6e6e6",
  hero: "#101113",
  brand: "#101113", // "Betterlytics" wordmark — near-black
  label: "#4d4f55", // category + "Blog" wordmark — gray
  date: "#8a8d93",
};

const FONT_DIR = join(process.cwd(), "assets", "fonts");
const LOGO_PATH = join(
  process.cwd(),
  "public",
  "betterlytics-logo-dark-simple.svg",
);

let fontCache: { w500: Buffer; w700: Buffer } | null = null;
let logoDataUrl: string | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const [w500, w700] = await Promise.all([
    readFile(join(FONT_DIR, "inter-tight-latin-500-normal.woff")),
    readFile(join(FONT_DIR, "inter-tight-latin-700-normal.woff")),
  ]);
  fontCache = { w500, w700 };
  return fontCache;
}

async function loadLogoDataUrl() {
  if (logoDataUrl) return logoDataUrl;
  const svg = await readFile(LOGO_PATH, "utf8");
  logoDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return logoDataUrl;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Deterministic, locale-independent date for the cover (matches the design's
// "May 15, 2026"). UTC so a midnight-Z publishedAt doesn't drift a day.
export function formatCoverDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export type CoverRenderOptions = {
  texture: TextureName;
  seed: number;
  palette?: PaletteName;
  params?: Record<string, number>;
  blurSigma: number;
  contrast: number;
  grain: number;
  fade: boolean;
  vignette: boolean;
  hero: string;
  category: string;
  date: string;
};

// Canonical cover options derived purely from a post's frontmatter — the
// production look. The playground layers raw query overrides on top of these.
export function coverOptionsForPost(post: BlogPost): CoverRenderOptions {
  const fm = post.frontmatter;
  const cover = fm.cover;
  const texture = pickTexture(post);
  const rd = renderDefaultsFor(texture);
  return {
    texture,
    seed: cover?.seed != null ? cover.seed >>> 0 : hashStr(post.slug),
    palette: cover?.palette,
    params: cover?.params,
    blurSigma: cover?.blur ?? rd.blur,
    contrast: cover?.contrast ?? rd.contrast,
    grain: rd.grain,
    fade: true,
    vignette: true,
    hero: fm.blueWord ?? fm.tags[0] ?? "Betterlytics",
    category: fm.tags[0] ?? "",
    date: formatCoverDate(fm.publishedAt),
  };
}

// ArrayBuffer is a valid BodyInit, and `new Response(buf)` copies the bytes —
// so a cached buffer can be served many times without being consumed.
export function pngResponse(bytes: ArrayBuffer): Response {
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function renderCover(o: CoverRenderOptions): Promise<ArrayBuffer> {
  // --- Build the texture background ---
  const small = computeTextureRgba(o.texture, o.seed, {
    params: o.params,
    palette: o.palette,
    contrast: o.contrast,
  });
  const grid = gridFor(o.texture);
  const png = renderTexturePng({
    small,
    smallW: grid.w,
    smallH: grid.h,
    width: W,
    height: H,
    blurSigma: o.blurSigma,
    grain: o.grain,
    grainSeed: (o.seed ^ 0x9e3779b9) >>> 0,
    fade: o.fade,
    vignette: o.vignette,
  });
  const bgDataUrl = `data:image/png;base64,${png.toString("base64")}`;

  // --- Chrome ---
  const { w500, w700 } = await loadFonts();
  const logoSrc = await loadLogoDataUrl();
  const heroSize = o.hero.length > 8 ? 7 * CQW : 9 * CQW; // 84px / 108px

  const image = new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          position: "relative",
          fontFamily: "Inter Tight",
          color: C.hero,
          background: C.surface,
        }}
      >
        {/* Texture background, full bleed */}
        <img
          src={bgDataUrl}
          width={W}
          height={H}
          alt=""
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* Hairline frame border */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            border: `1px solid ${C.border}`,
          }}
        />

        {/* Top-left: category */}
        <div
          style={{
            position: "absolute",
            top: 4.166 * CQW,
            left: 5 * CQW,
            fontSize: 2.4 * CQW,
            fontWeight: 500,
            color: C.label,
            letterSpacing: "-0.02em",
          }}
        >
          {o.category}
        </div>

        {/* Top-right: brand mark + wordmark ("Betterlytics" dark, "Blog" gray) */}
        <div
          style={{
            position: "absolute",
            top: 4.166 * CQW,
            right: 5 * CQW,
            display: "flex",
            alignItems: "center",
            gap: 1.166 * CQW,
            fontSize: 2.4 * CQW,
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          <img src={logoSrc} width={2.8 * CQW} height={2.8 * CQW} alt="" />
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ color: C.brand }}>Betterlytics</span>
            <span style={{ color: C.label, marginLeft: 0.7 * CQW }}>Blog</span>
          </div>
        </div>

        {/* Hero word — vertically centered, left-aligned */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 5 * CQW,
            width: W * 0.65 - 5 * CQW, // hero box: left 5cqw → right edge 35% from right
            height: H,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: heroSize,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 0.96,
              color: C.hero,
              whiteSpace: "nowrap",
            }}
          >
            {o.hero}
          </div>
        </div>

        {/* Bottom-left: date */}
        {o.date ? (
          <div
            style={{
              position: "absolute",
              bottom: 4.166 * CQW,
              left: 5 * CQW,
              fontSize: 2 * CQW,
              fontWeight: 500,
              color: C.date,
              letterSpacing: "-0.02em",
            }}
          >
            {o.date}
          </div>
        ) : null}
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Inter Tight", data: w500, weight: 500, style: "normal" },
        { name: "Inter Tight", data: w700, weight: 700, style: "normal" },
      ],
    },
  );

  return image.arrayBuffer();
}

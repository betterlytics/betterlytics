import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  computeTextureRgba,
  gridFor,
  hashStr,
  isTextureName,
  renderDefaultsFor,
  type PaletteName,
  type TextureName,
} from "@/app/blog/lib/cover-textures";
import { renderTexturePng } from "@/app/blog/lib/cover-raster";
import { getBlogPostBySlug } from "@/app/blog/lib/registry";
import { pickTexture } from "@/app/blog/lib/cover";

// In-page blog cover image (1200×630, light surface, procedural texture).
//
// Driven by `?slug=` (reads the post's frontmatter `cover` config + text), with
// every raw query param still overriding for the tuning playground. Output is
// deterministic given (texture, seed, params), so it's cached immutably.

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

function num(v: string | null, fallback: number): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---------- In-process render cache ----------
// Each cover is deterministic per request params, so we memoize the finished
// PNG bytes and return them without recomputing the texture + Satori render on
// repeat hits. Survives for the lifetime of the server process (and resets on
// dev HMR). Bounded LRU so memory stays in check.
const COVER_CACHE_MAX = 64;
const coverCache = new Map<string, ArrayBuffer>();

function coverCacheGet(key: string): ArrayBuffer | undefined {
  const hit = coverCache.get(key);
  if (hit) {
    coverCache.delete(key);
    coverCache.set(key, hit); // mark most-recently-used
  }
  return hit;
}

function coverCacheSet(key: string, bytes: ArrayBuffer): void {
  coverCache.set(key, bytes);
  if (coverCache.size > COVER_CACHE_MAX) {
    const oldest = coverCache.keys().next().value;
    if (oldest !== undefined) coverCache.delete(oldest);
  }
}

// ArrayBuffer is a valid BodyInit, and `new Response(buf)` copies the bytes —
// so a cached buffer can be served many times without being consumed.
function pngResponse(bytes: ArrayBuffer): Response {
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Deterministic, locale-independent date for the cover (matches the design's
// "May 15, 2026"). UTC so a midnight-Z publishedAt doesn't drift a day.
function formatCoverDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url);

  const cacheable = searchParams.has("slug") || searchParams.has("seed");
  const cacheKey = [...searchParams.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  if (cacheable) {
    const hit = coverCacheGet(cacheKey);
    if (hit) return pngResponse(hit);
  }

  // Optional post lookup — supplies deterministic defaults from frontmatter.
  // Raw query params still override everything (the tuning playground).
  const slug = searchParams.get("slug");
  const post = slug ? await getBlogPostBySlug(slug) : undefined;
  const cover = post?.frontmatter.cover;

  // Texture: query > post pick (frontmatter texture, else slug hash) > default.
  const textureParam = searchParams.get("texture");
  const texture: TextureName = isTextureName(textureParam)
    ? textureParam
    : post
      ? pickTexture(post)
      : "smoothed-ca";

  // Seed: query > frontmatter > slug hash > random (playground only).
  const seedParam = searchParams.get("seed");
  const seed =
    seedParam != null && Number.isFinite(Number(seedParam))
      ? Number(seedParam) >>> 0
      : cover?.seed != null
        ? cover.seed >>> 0
        : slug
          ? hashStr(slug)
          : Math.floor(Math.random() * 0x100000000) >>> 0;

  // Palette: query > frontmatter > texture default (undefined). Light only —
  // chrome + left-fade are light, so a dark ramp would clash (dark-mode cover
  // is a later, coordinated pass).
  const paletteParam = searchParams.get("palette");
  const palette: PaletteName | undefined =
    paletteParam === "blue" || paletteParam === "neutral"
      ? paletteParam
      : cover?.palette;

  // Algorithm params: query JSON > frontmatter > texture defaults (undefined).
  let params: Record<string, number> | undefined;
  const rawParams = searchParams.get("params");
  if (rawParams) {
    try {
      params = JSON.parse(rawParams);
    } catch {
      params = undefined;
    }
  }
  if (!params) params = cover?.params;

  // Post-processing: query > frontmatter > texture render defaults.
  const rd = renderDefaultsFor(texture);
  const blurSigma = num(searchParams.get("blur"), cover?.blur ?? rd.blur);
  const contrast = num(
    searchParams.get("contrast"),
    cover?.contrast ?? rd.contrast,
  );
  const grain = num(searchParams.get("grain"), rd.grain);
  const fade = searchParams.get("fade") !== "0";
  const vignette = searchParams.get("vignette") !== "0";

  // Chrome text: query > frontmatter-derived > fallback.
  const fm = post?.frontmatter;
  const hero =
    searchParams.get("hero") ?? fm?.blueWord ?? fm?.tags[0] ?? "Betterlytics";
  const category = searchParams.get("category") ?? fm?.tags[0] ?? "";
  const date =
    searchParams.get("date") ??
    (fm ? formatCoverDate(fm.publishedAt) : "");

  // --- Build the texture background ---
  const small = computeTextureRgba(texture, seed, {
    params,
    palette,
    contrast,
  });
  const grid = gridFor(texture);
  const png = renderTexturePng({
    small,
    smallW: grid.w,
    smallH: grid.h,
    width: W,
    height: H,
    blurSigma,
    grain,
    grainSeed: (seed ^ 0x9e3779b9) >>> 0,
    fade,
    vignette,
  });
  const bgDataUrl = `data:image/png;base64,${png.toString("base64")}`;

  // --- Chrome ---
  const { w500, w700 } = await loadFonts();
  const logoSrc = await loadLogoDataUrl();
  const heroSize = hero.length > 8 ? 7 * CQW : 9 * CQW; // 84px / 108px

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
          {category}
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
            {hero}
          </div>
        </div>

        {/* Bottom-left: date */}
        {date ? (
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
            {date}
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

  // Read the rendered bytes so we can both cache them and serve with our own
  // immutable headers. The `&v=` token (from the resolver) busts the cache when
  // a post's cover config or text changes.
  const rendered = await image.arrayBuffer();
  if (cacheable) coverCacheSet(cacheKey, rendered);
  return pngResponse(rendered);
}

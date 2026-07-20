import { NextRequest } from "next/server";
import {
  hashStr,
  isTextureName,
  renderDefaultsFor,
  type PaletteName,
  type TextureName,
} from "@/app/blog/lib/cover-textures";
import { getBlogPostBySlug } from "@/app/blog/lib/registry";
import { pickTexture } from "@/app/blog/lib/cover";
import {
  formatCoverDate,
  pngResponse,
  renderCover,
} from "@/app/blog/lib/cover-render";

// Tuning playground for the procedural blog cover (1200×630). Every raw query
// param overrides the post's frontmatter-derived defaults, so designers can
// dial in a look before pinning it. The canonical production cover is served
// statically from `/api/blog/cover/[slug]` (prerendered at build).

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

export async function GET(req: NextRequest): Promise<Response> {
  // Design-time tuning playground only. In production the canonical covers are
  // served statically from `/api/blog/cover/[slug]`, so this dynamic endpoint —
  // which runs a full Satori render per request and can't be cached when params
  // vary — must not be reachable (it would be an unauthenticated CPU-DoS vector).
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

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
    searchParams.get("date") ?? (fm ? formatCoverDate(fm.publishedAt) : "");

  const bytes = await renderCover({
    texture,
    seed,
    palette,
    params,
    blurSigma,
    contrast,
    grain,
    fade,
    vignette,
    hero,
    category,
    date,
  });

  if (cacheable) coverCacheSet(cacheKey, bytes);
  return pngResponse(bytes);
}

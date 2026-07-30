import { hashStr, isTextureName, type TextureName } from "./cover-textures";
import { type BlogPost } from "./registry";

// =============================================================================
// Cover resolution — decides what image a post's card/header shows:
//   • a real photo (frontmatter `coverImage`), or
//   • a deterministic procedural cover from /docs-static/api/blog/cover.
// Pure (no fs) so it's safe to call from any component.
// =============================================================================

// Texture chosen for a post that doesn't pin one — deterministic from the slug
// so photo-less posts look varied but never change.
const TEXTURE_ROTATION: TextureName[] = ["smoothed-ca", "flow", "voronoi"];

export function pickTexture(post: BlogPost): TextureName {
  const explicit = post.frontmatter.cover?.texture;
  if (explicit && isTextureName(explicit)) return explicit;
  return TEXTURE_ROTATION[hashStr(post.slug) % TEXTURE_ROTATION.length];
}

// Short token over everything that affects the generated pixels, so changing a
// post's cover config (or the text drawn on it) busts the immutable CDN cache.
export function coverVersion(post: BlogPost): string {
  const fm = post.frontmatter;
  const key = JSON.stringify({
    t: fm.cover?.texture ?? null,
    s: fm.cover?.seed ?? null,
    p: fm.cover?.palette ?? null,
    c: fm.cover?.contrast ?? null,
    b: fm.cover?.blur ?? null,
    pa: fm.cover?.params ?? null,
    hero: fm.blueWord ?? null,
    cat: fm.tags[0] ?? null,
    d: fm.publishedAt,
  });
  return hashStr(key).toString(36);
}

export type ResolvedCover = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** True when this is a procedural cover (skip Next image optimization). */
  generated: boolean;
};

export function resolveCover(post: BlogPost): ResolvedCover {
  const fm = post.frontmatter;
  if (fm.coverImage) {
    return { ...fm.coverImage, generated: false };
  }
  return {
    src: `/docs-static/api/blog/cover/${encodeURIComponent(post.slug)}?v=${coverVersion(post)}`,
    alt: fm.title,
    width: 1200,
    height: 630,
    generated: true,
  };
}

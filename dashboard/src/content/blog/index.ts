import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import { imageSize } from 'image-size';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import { BlogFrontmatterSchema, type BlogFrontmatter } from '@/entities/blog/blogPost.entities';

const POSTS_DIR = path.join(process.cwd(), 'src/content/blog/posts');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const POST_FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;
const WORDS_PER_MINUTE = 220;

/** Also the og:image size, which link previews crop to. */
export const BLOG_COVER_SIZE = { width: 1200, height: 630 };

/** next/image props for covers: they ship at their final size, and Next's WebP re-encode turns their dark gradients into blocks. */
export const BLOG_COVER_IMAGE = { ...BLOG_COVER_SIZE, unoptimized: true } as const;

export type BlogPost = BlogFrontmatter & {
  slug: string;
  source: string;
  readingMinutes: number;
};

// an opening <Figure …> tag; quoted and braced attribute values may contain '>'
const FIGURE_TAG = /<Figure\b(?:[^>"'{}]|"[^"]*"|'[^']*'|\{[^}]*\})*>/g;
const MARKDOWN_IMAGE = /!\[[^\]]*\]\((\/[^)\s]+)/g;

function readImageSize(bytes: Uint8Array) {
  try {
    return imageSize(bytes);
  } catch {
    return undefined;
  }
}

function attribute(tag: string, name: string) {
  const match = new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|\\{(\\d+)\\})`).exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

/** Throws on any invalid post: a broken post must fail the build, not vanish from the blog. */
export function parseBlogPost(
  file: string,
  raw: string,
  readAsset: (src: string) => Uint8Array | undefined,
): BlogPost {
  const slug = POST_FILE.exec(file)?.[1];
  if (!slug) {
    throw new Error(`Blog post ${file}: name it <slug>.mdx, the slug in lowercase words joined by hyphens`);
  }
  const { frontmatter, strippedSource } = getFrontmatter(raw);
  const parsed = BlogFrontmatterSchema.safeParse(frontmatter);
  if (!parsed.success) {
    throw new Error(`Blog post ${file} has invalid frontmatter:\n${parsed.error.message}`);
  }
  const readOwnAsset = (src: string | undefined) =>
    src?.startsWith(`/blog/${slug}/`) ? readAsset(src) : undefined;

  const { cover } = parsed.data;
  const coverBytes = readOwnAsset(cover.src);
  if (!coverBytes) {
    throw new Error(`Blog post ${file}: its cover ${cover.src} must be a file in public/blog/${slug}/`);
  }
  const coverSize = readImageSize(coverBytes);
  const { width, height } = BLOG_COVER_SIZE;
  if (
    coverSize?.width !== width ||
    coverSize.height !== height ||
    (coverSize.type !== 'png' && coverSize.type !== 'jpg')
  ) {
    throw new Error(`Blog post ${file}: its cover must be a ${width}x${height} PNG or JPEG`);
  }

  for (const [tag] of strippedSource.matchAll(FIGURE_TAG)) {
    const src = attribute(tag, 'src');
    const bytes = readOwnAsset(src);
    if (!bytes) {
      throw new Error(`Blog post ${file}: the Figure image ${src} must be a file in public/blog/${slug}/`);
    }
    const size = readImageSize(bytes);
    const declared = `${attribute(tag, 'width')}x${attribute(tag, 'height')}`;
    if (`${size?.width}x${size?.height}` !== declared) {
      throw new Error(
        `Blog post ${file}: the Figure for ${src} says ${declared}, but the image is ${size?.width}x${size?.height}`,
      );
    }
  }
  for (const [, src] of strippedSource.matchAll(MARKDOWN_IMAGE)) {
    if (!readOwnAsset(src)) {
      throw new Error(`Blog post ${file}: the image ${src} must be a file in public/blog/${slug}/`);
    }
  }

  const words = strippedSource.split(/\s+/).filter(Boolean).length;
  return {
    ...parsed.data,
    slug,
    source: strippedSource,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

function readPost(file: string): BlogPost {
  return parseBlogPost(file, fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'), (src) => {
    const assetPath = path.join(PUBLIC_DIR, src);
    return fs.existsSync(assetPath) ? fs.readFileSync(assetPath) : undefined;
  });
}

/** Every post on main is published: it goes out with the next release. */
export const getBlogPosts = cache((): BlogPost[] =>
  fs
    .readdirSync(POSTS_DIR)
    .filter((file) => !file.startsWith('.'))
    .map(readPost)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()),
);

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.slug === slug);
}

export function getOtherBlogPosts(post: BlogPost, limit = 3): BlogPost[] {
  return getBlogPosts()
    .filter((other) => other.slug !== post.slug)
    .slice(0, limit);
}

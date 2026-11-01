import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import { BlogFrontmatterSchema, type BlogFrontmatter } from '@/entities/blog/blogPost.entities';

export const BLOG_POSTS_DIR = path.join(process.cwd(), 'src/content/blog/posts');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const WORDS_PER_MINUTE = 220;

export type BlogPost = BlogFrontmatter & {
  slug: string;
  source: string;
  readingMinutes: number;
};

/** Throws on any invalid post: a broken post must fail the build, not vanish from the blog. */
function readPost(file: string): BlogPost {
  const slug = file.replace(/\.mdx$/, '');
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Blog post ${file}: the file name is the URL slug, so use lowercase words joined by hyphens`);
  }
  const { frontmatter, strippedSource } = getFrontmatter(fs.readFileSync(path.join(BLOG_POSTS_DIR, file), 'utf8'));
  const parsed = BlogFrontmatterSchema.safeParse(frontmatter);
  if (!parsed.success) {
    throw new Error(`Blog post ${file} has invalid frontmatter:\n${parsed.error.message}`);
  }
  const words = strippedSource.split(/\s+/).filter(Boolean).length;
  return {
    ...parsed.data,
    slug,
    source: strippedSource,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

export function getAllBlogPosts(): BlogPost[] {
  return fs
    .readdirSync(BLOG_POSTS_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map(readPost)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export function getPublishedBlogPosts(): BlogPost[] {
  return getAllBlogPosts().filter((post) => !post.draft);
}

/** Adds drafts under `next dev` only, so they can be previewed but never ship. */
export function getViewableBlogPosts(): BlogPost[] {
  return process.env.NODE_ENV === 'development' ? getAllBlogPosts() : getPublishedBlogPosts();
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getViewableBlogPosts().find((post) => post.slug === slug);
}

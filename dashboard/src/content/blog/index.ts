import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { getFrontmatter } from 'next-mdx-remote-client/utils';
import { BlogFrontmatterSchema, type BlogFrontmatter } from '@/entities/blog/blogPost.entities';

const POSTS_DIR = path.join(process.cwd(), 'src/content/blog/posts');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

const POST_FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.mdx$/;
const WORDS_PER_MINUTE = 220;

export type BlogPost = BlogFrontmatter & {
  slug: string;
  source: string;
  readingMinutes: number;
};

/** Throws on any invalid post: a broken post must fail the build, not vanish from the blog. */
function readPost(file: string): BlogPost {
  const slug = POST_FILE.exec(file)?.[1];
  if (!slug) {
    throw new Error(`Blog post ${file}: name it <slug>.mdx, the slug in lowercase words joined by hyphens`);
  }
  const { frontmatter, strippedSource } = getFrontmatter(fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'));
  const parsed = BlogFrontmatterSchema.safeParse(frontmatter);
  if (!parsed.success) {
    throw new Error(`Blog post ${file} has invalid frontmatter:\n${parsed.error.message}`);
  }
  const { cover } = parsed.data;
  if (!cover.src.startsWith(`/blog/${slug}/`) || !fs.existsSync(path.join(PUBLIC_DIR, cover.src))) {
    throw new Error(`Blog post ${file}: its cover ${cover.src} must be a file in public/blog/${slug}/`);
  }
  const words = strippedSource.split(/\s+/).filter(Boolean).length;
  return {
    ...parsed.data,
    slug,
    source: strippedSource,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

/** Every post on main is published: it goes out with the next release. */
export function getBlogPosts(): BlogPost[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => !file.startsWith('.'))
    .map(readPost)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.slug === slug);
}

/** Posts sharing the first tag come first; the sort is stable, so each group stays newest-first. */
export function getRelatedBlogPosts(post: BlogPost, limit = 3, posts = getBlogPosts()): BlogPost[] {
  const [tag] = post.tags;
  return posts
    .filter((other) => other.slug !== post.slug)
    .sort((a, b) => Number(b.tags.includes(tag)) - Number(a.tags.includes(tag)))
    .slice(0, limit);
}

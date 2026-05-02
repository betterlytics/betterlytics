import "server-only";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { importPage } from "nextra/pages";
import { blogFrontmatterSchema, type BlogFrontmatter } from "./schema";

export type BlogPost = {
  frontmatter: BlogFrontmatter;
  slug: string;
  readingTimeMinutes: number;
  url: string;
};

const BLOG_CONTENT_DIR = join(process.cwd(), "src", "content", "blog");
const SHOW_DRAFTS = process.env.NEXT_PUBLIC_BLOG_DRAFTS === "1";

function listBlogMdxFiles(): string[] {
  try {
    return readdirSync(BLOG_CONTENT_DIR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;
  return raw.slice(end + 4);
}

function readingTime(raw: string): number {
  const body = stripFrontmatter(raw);
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

let cached: BlogPost[] | null = null;

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (cached) return cached;

  const slugs = listBlogMdxFiles();
  const posts: BlogPost[] = [];

  for (const fileSlug of slugs) {
    const page = await importPage(["blog", fileSlug]);
    const fm = page.metadata as Record<string, unknown> | undefined;
    if (!fm) continue;

    const parsed = blogFrontmatterSchema.safeParse(fm);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in content/blog/${fileSlug}.mdx:\n${parsed.error.message}`
      );
    }
    const frontmatter = parsed.data;
    if (frontmatter.draft && !SHOW_DRAFTS) continue;

    const slug = frontmatter.slug || fileSlug;
    const raw = readFileSync(
      join(BLOG_CONTENT_DIR, `${fileSlug}.mdx`),
      "utf8"
    );

    posts.push({
      frontmatter,
      slug,
      readingTimeMinutes: readingTime(raw),
      url: `/blog/${slug}`,
    });
  }

  posts.sort(
    (a, b) =>
      new Date(b.frontmatter.publishedAt).getTime() -
      new Date(a.frontmatter.publishedAt).getTime()
  );

  cached = posts;
  return posts;
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug);
}

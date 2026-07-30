import type { MetadataRoute } from "next";
import { getBlogPosts } from "./lib/registry";
import { blogIndexCanonicalUrl, blogPostCanonicalUrl } from "./lib/seo";

// Served at /blog/sitemap.xml (the proxy routes /blog/* to this app) and
// generated from the registry, so publishing a post updates it automatically —
// drafts stay out. Discovery is gated by the dashboard's robots.ts, which only
// advertises this sitemap when crawling is allowed; the sitemap itself is
// static and env-independent so docker builds (which have no root .env) can't
// bake an empty one.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();

  return [
    {
      url: blogIndexCanonicalUrl(),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...posts.map((post) => ({
      url: blogPostCanonicalUrl(post.slug),
      lastModified: new Date(
        post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
      ),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

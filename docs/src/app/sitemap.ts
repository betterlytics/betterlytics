import type { MetadataRoute } from "next";
import { getBlogPosts } from "./blog/lib/registry";
import { SITE_URL, blogIndexCanonicalUrl, blogPostCanonicalUrl } from "./blog/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();

  const blogIndex: MetadataRoute.Sitemap[number] = {
    url: blogIndexCanonicalUrl(),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  };

  const blogPosts: MetadataRoute.Sitemap = posts.map((p) => ({
    url: blogPostCanonicalUrl(p.slug),
    lastModified: new Date(
      p.frontmatter.updatedAt ?? p.frontmatter.publishedAt
    ),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [
    {
      url: `${SITE_URL}/blog`,
      lastModified: blogIndex.lastModified,
      changeFrequency: blogIndex.changeFrequency,
      priority: blogIndex.priority,
    },
    ...blogPosts,
  ];
}

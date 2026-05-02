import { Metadata } from "next";
import { getBlogPosts } from "./lib/registry";
import { BlogPostCard } from "./components/BlogPostCard";
import { BlogIndexHero } from "./components/BlogIndexHero";
import { BlogStructuredData } from "./components/BlogStructuredData";
import { blogIndexCanonicalUrl, buildBlogIndexJsonLd } from "./lib/seo";

export const metadata: Metadata = {
  title: "Blog | Betterlytics",
  description:
    "Notes on privacy-first analytics, GDPR, and what we're building at Betterlytics.",
  alternates: {
    canonical: blogIndexCanonicalUrl(),
  },
  openGraph: {
    type: "website",
    url: blogIndexCanonicalUrl(),
    title: "The Betterlytics Blog",
    description:
      "Notes on privacy-first analytics, GDPR, and what we're building at Betterlytics.",
    siteName: "Betterlytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Betterlytics Blog",
    description:
      "Notes on privacy-first analytics, GDPR, and what we're building at Betterlytics.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();
  const featured = posts.filter((p) => p.frontmatter.featured);
  const standard = posts.filter((p) => !p.frontmatter.featured);

  return (
    <>
      <BlogStructuredData
        id="blog-index-jsonld"
        data={buildBlogIndexJsonLd(posts)}
      />
      <BlogIndexHero />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts yet. Check back soon.</p>
        ) : (
          <div className="space-y-8">
            {featured.length > 0 && (
              <div className="space-y-8">
                {featured.map((post) => (
                  <BlogPostCard key={post.slug} post={post} featured />
                ))}
              </div>
            )}
            {standard.length > 0 && (
              <div className="grid gap-8 sm:grid-cols-1">
                {standard.map((post) => (
                  <BlogPostCard key={post.slug} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

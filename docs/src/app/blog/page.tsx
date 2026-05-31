import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getBlogPosts } from "./lib/registry";
import { getAuthor } from "./lib/authors";
import { resolveCover } from "./lib/cover";
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase()
  );
}

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  // Featured = newest post flagged `featured` (posts are newest-first)
  const featured = posts.find((p) => p.frontmatter.featured) ?? posts[0];

  const featuredCover = featured ? resolveCover(featured) : null;
  const featuredAuthor = featured ? getAuthor(featured.frontmatter.author) : null;

  return (
    <>
      <BlogStructuredData
        id="blog-index-jsonld"
        data={buildBlogIndexJsonLd(posts)}
      />
      <div className="blog-index">
        <div className="index-head">
          <h1>Blog</h1>
          <p>
            News, deep dives, and changelog notes from the team building
            Betterlytics.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="bi-empty">No posts yet. Check back soon.</p>
        ) : (
          <>
            {featured && featuredCover && (
              <Link href={featured.url} className="featured">
                <div className="bi-cover ft-cover">
                  <Image
                    src={featuredCover.src}
                    alt={featuredCover.alt}
                    fill
                    priority
                    unoptimized={featuredCover.generated}
                    sizes="(min-width: 768px) 55vw, 100vw"
                  />
                </div>
                <div className="ft-body">
                  <div className="ft-cat">
                    Featured
                    {featured.frontmatter.tags[0]
                      ? ` · ${featured.frontmatter.tags[0]}`
                      : ""}
                  </div>
                  <h2 className="ft-title">{featured.frontmatter.title}</h2>
                  <p className="ft-excerpt">
                    {featured.frontmatter.description}
                  </p>
                  <div className="ft-meta">
                    {featuredAuthor && (
                      <>
                        <span className="bi-avatar">
                          {initials(featuredAuthor.name)}
                        </span>
                        <span className="name">{featuredAuthor.name}</span>
                        <span className="sep">·</span>
                      </>
                    )}
                    <span>{formatDate(featured.frontmatter.publishedAt)}</span>
                    <span className="sep">·</span>
                    <span className="reading">
                      {featured.readingTimeMinutes} min read
                    </span>
                  </div>
                </div>
              </Link>
            )}

            <div className="bi-grid">
              {posts.map((p) => {
                const cover = resolveCover(p);
                const category = p.frontmatter.tags[0];
                return (
                  <Link key={p.slug} href={p.url} className="grid-card">
                    <div className="bi-cover gc-cover">
                      <Image
                        src={cover.src}
                        alt={cover.alt}
                        fill
                        unoptimized={cover.generated}
                        sizes="(min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
                      />
                    </div>
                    {category && <div className="gc-cat">{category}</div>}
                    <h3 className="gc-title">{p.frontmatter.title}</h3>
                    <p className="gc-excerpt">{p.frontmatter.description}</p>
                    <div className="gc-meta">
                      <span>{formatDate(p.frontmatter.publishedAt)}</span>
                      <span className="sep">·</span>
                      <span>{p.readingTimeMinutes} min read</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";
import { importPage } from "nextra/pages";
import {
  getAdjacentPosts,
  getBlogPostBySlug,
  getBlogPosts,
} from "../lib/registry";
import { BlogPostHeader } from "../components/BlogPostHeader";
import { BlogPostFooter } from "../components/BlogPostFooter";
import { BlogStructuredData } from "../components/BlogStructuredData";
import { BlogFAQ } from "../components/BlogFAQ";
import { BlogAnchor } from "../components/BlogAnchor";
import { BlogToc } from "../components/BlogToc";
import {
  blogPostCanonicalUrl,
  buildArticleJsonLd,
  buildFaqJsonLd,
} from "../lib/seo";
import { getAuthor } from "../lib/authors";

// Slugs are single segments (enforced by the registry's slug validation), so
// a plain dynamic segment suffices — and unlike a catch-all it supports the
// opengraph-image/twitter-image file conventions.
type Params = { slug: string };

// Every publishable slug is known at build time; unknown slugs 404 at the
// router instead of invoking this page (or its opengraph-image) at runtime.
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await props.params;

  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  const author = getAuthor(post.frontmatter.author);
  const url = blogPostCanonicalUrl(post.slug);

  // og:image / twitter:image come from the sibling opengraph-image.tsx /
  // twitter-image.tsx file conventions — not set here.
  return {
    title: `${post.frontmatter.title} | Betterlytics Blog`,
    description: post.frontmatter.description,
    keywords: post.frontmatter.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      siteName: "Betterlytics",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      publishedTime: post.frontmatter.publishedAt,
      modifiedTime: post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
      authors: [author.name],
      tags: post.frontmatter.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
    },
  };
}

export default async function BlogPostPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;

  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const page = await importPage(["blog", slug]);
  const { default: MDXContent } = page;
  const { previous, next } = await getAdjacentPosts(slug);

  return (
    <>
      <BlogStructuredData
        id="blog-article-jsonld"
        data={buildArticleJsonLd(post)}
      />
      {post.frontmatter.faqs.length > 0 && (
        <BlogStructuredData
          id="blog-faq-jsonld"
          data={buildFaqJsonLd(post.frontmatter.faqs)}
        />
      )}

      <article className="post-wrap">
        <div className="post-grid">
          <div className="post-main">
            <BlogPostHeader post={post} />
            <div className="blog-prose">
              <MDXContent components={{ a: BlogAnchor }} />
            </div>
            {post.frontmatter.faqs.length > 0 && (
              <BlogFAQ items={post.frontmatter.faqs} />
            )}
            <BlogPostFooter post={post} previous={previous} next={next} />
          </div>

          <div className="post-aside-right">
            <BlogToc />
          </div>
        </div>
      </article>
    </>
  );
}

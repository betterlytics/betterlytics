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
  SITE_URL,
} from "../lib/seo";
import { getAuthor } from "../lib/authors";

type Params = { slug?: string[] };

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const posts = await getBlogPosts();
  return posts.map((p) => ({ slug: [p.slug] }));
}

function resolveSlug(params: Params): string | null {
  if (!params.slug || params.slug.length === 0) return null;
  return params.slug.join("/");
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const slug = resolveSlug(params);
  if (!slug) return {};

  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  const author = getAuthor(post.frontmatter.author);
  const url = blogPostCanonicalUrl(post.slug);
  const ogImageUrl = post.frontmatter.ogImage
    ? post.frontmatter.ogImage.startsWith("http")
      ? post.frontmatter.ogImage
      : `${SITE_URL}${post.frontmatter.ogImage}`
    : `${SITE_URL}/api/og/blog?slug=${encodeURIComponent(post.slug)}`;

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
      modifiedTime:
        post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
      authors: [author.name],
      tags: post.frontmatter.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage(props: {
  params: Promise<Params>;
}) {
  const params = await props.params;
  const slug = resolveSlug(params);
  if (!slug) notFound();

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
